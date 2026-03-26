import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { document_id, staff_id, organization_id, signature_data, signature_type, staff_name } = body;

    if (!document_id || !staff_id || !organization_id || !signature_data || !signature_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify staff belongs to org
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("id, name, organization_id")
      .eq("id", staff_id)
      .eq("organization_id", organization_id)
      .single();

    if (staffError || !staff) {
      return new Response(JSON.stringify({ error: "Staff not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get document
    const { data: doc, error: docError } = await supabase
      .from("staff_signable_documents")
      .select("*")
      .eq("id", document_id)
      .eq("organization_id", organization_id)
      .single();

    if (docError || !doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download original PDF
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("staff-documents")
      .download(doc.file_path);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "Failed to download document" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfBytes = await fileData.arrayBuffer();
    let pdfDoc: PDFDocument;

    try {
      pdfDoc = await PDFDocument.load(pdfBytes);
    } catch {
      // If it's not a valid PDF (e.g., docx), create a new PDF with just the signature page
      pdfDoc = await PDFDocument.create();
    }

    // Add signature page
    const page = pdfDoc.addPage([612, 792]); // US Letter
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const signedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const black = rgb(0, 0, 0);
    const gray = rgb(0.4, 0.4, 0.4);
    const lineColor = rgb(0.7, 0.7, 0.7);

    // Title
    page.drawText("SIGNATURE PAGE", {
      x: 72,
      y: 720,
      size: 18,
      font: helveticaBold,
      color: black,
    });

    // Document title
    page.drawText(`Document: ${doc.title}`, {
      x: 72,
      y: 685,
      size: 12,
      font: helvetica,
      color: gray,
    });

    // Divider
    page.drawLine({
      start: { x: 72, y: 670 },
      end: { x: 540, y: 670 },
      thickness: 1,
      color: lineColor,
    });

    // Agreement text
    const agreementText = `By signing below, I acknowledge that I have read, understood, and agree to the terms and conditions set forth in the document "${doc.title}".`;
    
    // Simple word-wrap
    const maxWidth = 468; // 540 - 72
    const words = agreementText.split(" ");
    let lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = helvetica.widthOfTextAtSize(testLine, 11);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    let yPos = 645;
    for (const line of lines) {
      page.drawText(line, {
        x: 72,
        y: yPos,
        size: 11,
        font: helvetica,
        color: black,
      });
      yPos -= 18;
    }

    yPos -= 20;

    // Name field
    page.drawText("Full Name:", {
      x: 72,
      y: yPos,
      size: 10,
      font: helveticaBold,
      color: gray,
    });
    yPos -= 20;
    page.drawText(staff_name || staff.name || "N/A", {
      x: 72,
      y: yPos,
      size: 14,
      font: helvetica,
      color: black,
    });
    yPos -= 5;
    page.drawLine({
      start: { x: 72, y: yPos },
      end: { x: 350, y: yPos },
      thickness: 0.5,
      color: lineColor,
    });

    yPos -= 30;

    // Date field
    page.drawText("Date Signed:", {
      x: 72,
      y: yPos,
      size: 10,
      font: helveticaBold,
      color: gray,
    });
    yPos -= 20;
    page.drawText(signedDate, {
      x: 72,
      y: yPos,
      size: 12,
      font: helvetica,
      color: black,
    });
    yPos -= 5;
    page.drawLine({
      start: { x: 72, y: yPos },
      end: { x: 350, y: yPos },
      thickness: 0.5,
      color: lineColor,
    });

    yPos -= 30;

    // Signature field
    page.drawText("Signature:", {
      x: 72,
      y: yPos,
      size: 10,
      font: helveticaBold,
      color: gray,
    });
    yPos -= 10;

    if (signature_type === "draw") {
      // Download signature image from storage
      const { data: sigData, error: sigDownloadError } = await supabase.storage
        .from("staff-documents")
        .download(signature_data);

      if (!sigDownloadError && sigData) {
        try {
          const sigBytes = await sigData.arrayBuffer();
          const sigImage = await pdfDoc.embedPng(new Uint8Array(sigBytes));
          const sigDims = sigImage.scale(0.5);
          const maxSigWidth = 250;
          const maxSigHeight = 80;
          const scale = Math.min(maxSigWidth / sigDims.width, maxSigHeight / sigDims.height, 1);

          page.drawImage(sigImage, {
            x: 72,
            y: yPos - (sigDims.height * scale),
            width: sigDims.width * scale,
            height: sigDims.height * scale,
          });
          yPos -= (sigDims.height * scale) + 10;
        } catch {
          // Fallback if image embedding fails
          page.drawText("[Drawn Signature on File]", {
            x: 72,
            y: yPos - 20,
            size: 12,
            font: helvetica,
            color: gray,
          });
          yPos -= 30;
        }
      }
    } else {
      // Typed signature
      const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
      page.drawText(signature_data, {
        x: 72,
        y: yPos - 25,
        size: 24,
        font: timesRoman,
        color: black,
      });
      yPos -= 40;
    }

    page.drawLine({
      start: { x: 72, y: yPos },
      end: { x: 350, y: yPos },
      thickness: 0.5,
      color: lineColor,
    });

    // Footer
    page.drawText(
      "This document was electronically signed and is legally binding.",
      {
        x: 72,
        y: 60,
        size: 8,
        font: helvetica,
        color: gray,
      }
    );

    // Save signed PDF
    const signedPdfBytes = await pdfDoc.save();
    const signedPath = `signed/${organization_id}/${staff_id}/${document_id}_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("staff-documents")
      .upload(signedPath, signedPdfBytes, {
        contentType: "application/pdf",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to save signed PDF" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, signed_pdf_path: signedPath }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating signed PDF:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
