import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LINDY_API_KEY = Deno.env.get("LINDY_API_KEY");
    if (!LINDY_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { api_key, action, organization_id, ...params } = body;

    if (!api_key || api_key !== LINDY_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Missing required field: action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: organization_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify organization exists
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organization_id)
      .single();

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: "Invalid organization_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: any;

    switch (action) {
      // ============ CUSTOMERS ============

      case "get_customers": {
        const { limit = 50, offset = 0, search, status } = params;
        let query = supabase
          .from("customers")
          .select("id, first_name, last_name, email, phone, address, city, state, zip_code, is_recurring, customer_status, marketing_status, created_at, notes")
          .eq("organization_id", organization_id)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (search) {
          query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }
        if (status) query = query.eq("customer_status", status);

        const { data, error } = await query;
        if (error) throw error;
        result = { customers: data, count: data?.length || 0 };
        break;
      }

      case "get_customer": {
        const { customer_id } = params;
        if (!customer_id) throw new Error("Missing customer_id");

        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customer_id)
          .eq("organization_id", organization_id)
          .single();

        if (error) throw error;
        result = { customer: data };
        break;
      }

      case "create_customer": {
        const { first_name, last_name, email, phone, address, city, state, zip_code, notes } = params;
        if (!first_name || !email) throw new Error("Missing first_name or email");

        const { data, error } = await supabase
          .from("customers")
          .insert({
            organization_id,
            first_name: String(first_name).slice(0, 100),
            last_name: last_name ? String(last_name).slice(0, 100) : "",
            email: String(email).slice(0, 255),
            phone: phone ? String(phone).slice(0, 20) : null,
            address: address ? String(address).slice(0, 255) : null,
            city: city ? String(city).slice(0, 100) : null,
            state: state ? String(state).slice(0, 50) : null,
            zip_code: zip_code ? String(zip_code).slice(0, 10) : null,
            notes: notes ? String(notes).slice(0, 2000) : null,
          })
          .select()
          .single();

        if (error) throw error;
        result = { customer: data, message: "Customer created successfully" };
        break;
      }

      case "update_customer": {
        const { customer_id, ...updates } = params;
        if (!customer_id) throw new Error("Missing customer_id");

        const allowedFields = ["first_name", "last_name", "email", "phone", "address", "city", "state", "zip_code", "notes", "customer_status", "marketing_status"];
        const sanitizedUpdates: Record<string, any> = {};
        for (const key of allowedFields) {
          if (updates[key] !== undefined) {
            sanitizedUpdates[key] = updates[key] ? String(updates[key]).slice(0, 255) : null;
          }
        }

        const { data, error } = await supabase
          .from("customers")
          .update(sanitizedUpdates)
          .eq("id", customer_id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { customer: data, message: "Customer updated successfully" };
        break;
      }

      case "delete_customer": {
        const { customer_id } = params;
        if (!customer_id) throw new Error("Missing customer_id");

        const { error } = await supabase
          .from("customers")
          .delete()
          .eq("id", customer_id)
          .eq("organization_id", organization_id);

        if (error) throw error;
        result = { message: "Customer deleted successfully" };
        break;
      }

      // ============ BOOKINGS ============

      case "get_bookings": {
        const { limit = 50, offset = 0, status, customer_id, staff_id, from_date, to_date } = params;
        let query = supabase
          .from("bookings")
          .select(`
            id, booking_number, scheduled_at, status, payment_status, total_amount, 
            duration, address, city, state, notes, frequency, extras,
            customer_id, staff_id, service_id,
            customers(first_name, last_name, email, phone),
            services(name),
            staff(name)
          `)
          .eq("organization_id", organization_id)
          .order("scheduled_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) query = query.eq("status", status);
        if (customer_id) query = query.eq("customer_id", customer_id);
        if (staff_id) query = query.eq("staff_id", staff_id);
        if (from_date) query = query.gte("scheduled_at", from_date);
        if (to_date) query = query.lte("scheduled_at", to_date);

        const { data, error } = await query;
        if (error) throw error;
        result = { bookings: data, count: data?.length || 0 };
        break;
      }

      case "get_booking": {
        const { booking_id } = params;
        if (!booking_id) throw new Error("Missing booking_id");

        const { data, error } = await supabase
          .from("bookings")
          .select(`
            *,
            customers(first_name, last_name, email, phone),
            services(name, price, duration),
            staff(name, email, phone)
          `)
          .eq("id", booking_id)
          .eq("organization_id", organization_id)
          .single();

        if (error) throw error;
        result = { booking: data };
        break;
      }

      case "create_booking": {
        const { customer_id, service_id, staff_id, scheduled_at, duration, address, city, state, zip_code, notes, total_amount, frequency, extras } = params;
        if (!customer_id || !scheduled_at) throw new Error("Missing customer_id or scheduled_at");

        const { data, error } = await supabase
          .from("bookings")
          .insert({
            organization_id,
            customer_id,
            service_id: service_id || null,
            staff_id: staff_id || null,
            scheduled_at,
            duration: duration || 120,
            address: address ? String(address).slice(0, 255) : null,
            city: city ? String(city).slice(0, 100) : null,
            state: state ? String(state).slice(0, 50) : null,
            zip_code: zip_code ? String(zip_code).slice(0, 10) : null,
            notes: notes ? String(notes).slice(0, 2000) : null,
            total_amount: total_amount || 0,
            frequency: frequency || "one_time",
            extras: extras || null,
            status: "confirmed",
            payment_status: "pending",
          })
          .select()
          .single();

        if (error) throw error;
        result = { booking: data, message: "Booking created successfully" };
        break;
      }

      case "update_booking": {
        const { booking_id, ...updates } = params;
        if (!booking_id) throw new Error("Missing booking_id");

        const allowedFields = ["scheduled_at", "status", "payment_status", "staff_id", "service_id", "notes", "total_amount", "duration", "address", "city", "state", "zip_code", "frequency", "extras"];
        const sanitizedUpdates: Record<string, any> = {};
        for (const key of allowedFields) {
          if (updates[key] !== undefined) {
            sanitizedUpdates[key] = updates[key];
          }
        }

        const { data, error } = await supabase
          .from("bookings")
          .update(sanitizedUpdates)
          .eq("id", booking_id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { booking: data, message: "Booking updated successfully" };
        break;
      }

      case "cancel_booking": {
        const { booking_id } = params;
        if (!booking_id) throw new Error("Missing booking_id");

        const { data, error } = await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", booking_id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { booking: data, message: "Booking cancelled successfully" };
        break;
      }

      case "complete_booking": {
        const { booking_id, payment_status } = params;
        if (!booking_id) throw new Error("Missing booking_id");

        const { data, error } = await supabase
          .from("bookings")
          .update({ status: "completed", payment_status: payment_status || "paid" })
          .eq("id", booking_id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { booking: data, message: "Booking marked as completed" };
        break;
      }

      // ============ LEADS ============

      case "get_leads": {
        const { limit = 50, offset = 0, status, source, search } = params;
        let query = supabase
          .from("leads")
          .select("id, name, email, phone, source, status, notes, service_interest, estimated_value, created_at")
          .eq("organization_id", organization_id)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) query = query.eq("status", status);
        if (source) query = query.eq("source", source);
        if (search) {
          query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        result = { leads: data, count: data?.length || 0 };
        break;
      }

      case "create_lead": {
        const { name, email, phone, source, notes, service_interest, estimated_value } = params;
        if (!name || !email) throw new Error("Missing name or email");

        const { data, error } = await supabase
          .from("leads")
          .insert({
            organization_id,
            name: String(name).slice(0, 200),
            email: String(email).slice(0, 255),
            phone: phone ? String(phone).slice(0, 20) : null,
            source: source ? String(source).slice(0, 50) : "lindy",
            notes: notes ? String(notes).slice(0, 2000) : null,
            service_interest: service_interest ? String(service_interest).slice(0, 100) : null,
            estimated_value: estimated_value || null,
            status: "new",
          })
          .select()
          .single();

        if (error) throw error;
        result = { lead: data, message: "Lead created successfully" };
        break;
      }

      case "update_lead": {
        const { lead_id, ...updates } = params;
        if (!lead_id) throw new Error("Missing lead_id");

        const allowedFields = ["name", "email", "phone", "status", "notes", "source", "service_interest", "estimated_value"];
        const sanitizedUpdates: Record<string, any> = {};
        for (const key of allowedFields) {
          if (updates[key] !== undefined) {
            sanitizedUpdates[key] = updates[key] ? String(updates[key]).slice(0, 255) : null;
          }
        }

        const { data, error } = await supabase
          .from("leads")
          .update(sanitizedUpdates)
          .eq("id", lead_id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { lead: data, message: "Lead updated successfully" };
        break;
      }

      case "delete_lead": {
        const { lead_id } = params;
        if (!lead_id) throw new Error("Missing lead_id");

        const { error } = await supabase
          .from("leads")
          .delete()
          .eq("id", lead_id)
          .eq("organization_id", organization_id);

        if (error) throw error;
        result = { message: "Lead deleted successfully" };
        break;
      }

      case "convert_lead_to_customer": {
        const { lead_id } = params;
        if (!lead_id) throw new Error("Missing lead_id");

        const { data: lead, error: leadError } = await supabase
          .from("leads")
          .select("*")
          .eq("id", lead_id)
          .eq("organization_id", organization_id)
          .single();

        if (leadError || !lead) throw new Error("Lead not found");

        // Split name into first/last
        const nameParts = (lead.name || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const { data: customer, error: custError } = await supabase
          .from("customers")
          .insert({
            organization_id,
            first_name: firstName,
            last_name: lastName,
            email: lead.email,
            phone: lead.phone,
            address: lead.address || null,
            notes: lead.notes || null,
          })
          .select()
          .single();

        if (custError) throw custError;

        // Mark lead as converted
        await supabase
          .from("leads")
          .update({ status: "converted" })
          .eq("id", lead_id)
          .eq("organization_id", organization_id);

        result = { customer, message: "Lead converted to customer successfully" };
        break;
      }

      // ============ STAFF ============

      case "get_staff": {
        const { include_inactive } = params;
        let query = supabase
          .from("staff")
          .select("id, name, email, phone, is_active, hourly_rate, created_at")
          .eq("organization_id", organization_id)
          .order("name");

        if (!include_inactive) query = query.eq("is_active", true);

        const { data, error } = await query;
        if (error) throw error;
        result = { staff: data, count: data?.length || 0 };
        break;
      }

      case "get_staff_member": {
        const { staff_id } = params;
        if (!staff_id) throw new Error("Missing staff_id");

        const { data, error } = await supabase
          .from("staff")
          .select("*")
          .eq("id", staff_id)
          .eq("organization_id", organization_id)
          .single();

        if (error) throw error;
        result = { staff_member: data };
        break;
      }

      case "get_staff_schedule": {
        const { staff_id, from_date, to_date } = params;
        if (!staff_id || !from_date || !to_date) throw new Error("Missing staff_id, from_date, or to_date");

        const { data, error } = await supabase
          .from("bookings")
          .select("id, booking_number, scheduled_at, duration, status, address, customers(first_name, last_name), services(name)")
          .eq("organization_id", organization_id)
          .eq("staff_id", staff_id)
          .gte("scheduled_at", from_date)
          .lte("scheduled_at", to_date)
          .in("status", ["pending", "confirmed"])
          .order("scheduled_at", { ascending: true });

        if (error) throw error;
        result = { schedule: data, count: data?.length || 0 };
        break;
      }

      // ============ SERVICES ============

      case "get_services": {
        const { include_inactive } = params;
        let query = supabase
          .from("services")
          .select("id, name, description, price, duration, is_active, created_at")
          .eq("organization_id", organization_id)
          .order("name");

        if (!include_inactive) query = query.eq("is_active", true);

        const { data, error } = await query;
        if (error) throw error;
        result = { services: data, count: data?.length || 0 };
        break;
      }

      // ============ INVOICES ============

      case "get_invoices": {
        const { limit = 50, offset = 0, status, customer_id } = params;
        let query = supabase
          .from("invoices")
          .select("id, invoice_number, customer_id, total_amount, subtotal, tax_amount, status, due_date, created_at, customers(first_name, last_name, email)")
          .eq("organization_id", organization_id)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) query = query.eq("status", status);
        if (customer_id) query = query.eq("customer_id", customer_id);

        const { data, error } = await query;
        if (error) throw error;
        result = { invoices: data, count: data?.length || 0 };
        break;
      }

      case "get_invoice": {
        const { invoice_id } = params;
        if (!invoice_id) throw new Error("Missing invoice_id");

        const { data, error } = await supabase
          .from("invoices")
          .select("*, customers(first_name, last_name, email, phone, address)")
          .eq("id", invoice_id)
          .eq("organization_id", organization_id)
          .single();

        if (error) throw error;
        result = { invoice: data };
        break;
      }

      // ============ QUOTES ============

      case "get_quotes": {
        const { limit = 50, offset = 0, status, customer_id } = params;
        let query = supabase
          .from("quotes")
          .select("id, quote_number, customer_id, lead_id, service_id, total_amount, subtotal, status, valid_until, created_at, customers(first_name, last_name, email), leads(name, email), services(name)")
          .eq("organization_id", organization_id)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) query = query.eq("status", status);
        if (customer_id) query = query.eq("customer_id", customer_id);

        const { data, error } = await query;
        if (error) throw error;
        result = { quotes: data, count: data?.length || 0 };
        break;
      }

      case "create_quote": {
        const { customer_id, lead_id, service_id, total_amount, subtotal, notes, valid_until, address, city, state, zip_code, bedrooms, bathrooms, square_footage, extras } = params;
        if (!total_amount) throw new Error("Missing total_amount");

        const { data, error } = await supabase
          .from("quotes")
          .insert({
            organization_id,
            customer_id: customer_id || null,
            lead_id: lead_id || null,
            service_id: service_id || null,
            total_amount,
            subtotal: subtotal || total_amount,
            notes: notes ? String(notes).slice(0, 2000) : null,
            valid_until: valid_until || null,
            address: address || null,
            city: city || null,
            state: state || null,
            zip_code: zip_code || null,
            bedrooms: bedrooms || null,
            bathrooms: bathrooms || null,
            square_footage: square_footage || null,
            extras: extras || null,
            status: "draft",
          })
          .select()
          .single();

        if (error) throw error;
        result = { quote: data, message: "Quote created successfully" };
        break;
      }

      case "update_quote": {
        const { quote_id, ...updates } = params;
        if (!quote_id) throw new Error("Missing quote_id");

        const allowedFields = ["status", "total_amount", "subtotal", "notes", "valid_until", "customer_id", "lead_id", "service_id", "address", "bedrooms", "bathrooms"];
        const sanitizedUpdates: Record<string, any> = {};
        for (const key of allowedFields) {
          if (updates[key] !== undefined) sanitizedUpdates[key] = updates[key];
        }

        const { data, error } = await supabase
          .from("quotes")
          .update(sanitizedUpdates)
          .eq("id", quote_id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { quote: data, message: "Quote updated successfully" };
        break;
      }

      // ============ EXPENSES ============

      case "get_expenses": {
        const { limit = 50, offset = 0, category, from_date, to_date } = params;
        let query = supabase
          .from("expenses")
          .select("id, description, amount, category, vendor, expense_date, receipt_url, created_at")
          .eq("organization_id", organization_id)
          .order("expense_date", { ascending: false })
          .range(offset, offset + limit - 1);

        if (category) query = query.eq("category", category);
        if (from_date) query = query.gte("expense_date", from_date);
        if (to_date) query = query.lte("expense_date", to_date);

        const { data, error } = await query;
        if (error) throw error;

        // Calculate total
        const total = (data || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        result = { expenses: data, count: data?.length || 0, total };
        break;
      }

      case "create_expense": {
        const { description, amount, category, vendor, expense_date } = params;
        if (!description || !amount) throw new Error("Missing description or amount");

        const { data, error } = await supabase
          .from("expenses")
          .insert({
            organization_id,
            description: String(description).slice(0, 255),
            amount,
            category: category || "other",
            vendor: vendor ? String(vendor).slice(0, 100) : null,
            expense_date: expense_date || new Date().toISOString().split("T")[0],
          })
          .select()
          .single();

        if (error) throw error;
        result = { expense: data, message: "Expense created successfully" };
        break;
      }

      case "update_expense": {
        const { expense_id, ...updates } = params;
        if (!expense_id) throw new Error("Missing expense_id");

        const allowedFields = ["description", "amount", "category", "vendor", "expense_date"];
        const sanitizedUpdates: Record<string, any> = {};
        for (const key of allowedFields) {
          if (updates[key] !== undefined) sanitizedUpdates[key] = updates[key];
        }

        const { data, error } = await supabase
          .from("expenses")
          .update(sanitizedUpdates)
          .eq("id", expense_id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { expense: data, message: "Expense updated successfully" };
        break;
      }

      case "delete_expense": {
        const { expense_id } = params;
        if (!expense_id) throw new Error("Missing expense_id");

        const { error } = await supabase
          .from("expenses")
          .delete()
          .eq("id", expense_id)
          .eq("organization_id", organization_id);

        if (error) throw error;
        result = { message: "Expense deleted successfully" };
        break;
      }

      // ============ RECURRING BOOKINGS ============

      case "get_recurring_bookings": {
        const { customer_id, active_only = true } = params;
        let query = supabase
          .from("recurring_bookings")
          .select("id, customer_id, service_id, staff_id, frequency, preferred_day, preferred_time, total_amount, is_active, next_scheduled_at, address, city, state, notes, created_at, customers(first_name, last_name), services(name), staff(name)")
          .eq("organization_id", organization_id)
          .order("created_at", { ascending: false });

        if (active_only) query = query.eq("is_active", true);
        if (customer_id) query = query.eq("customer_id", customer_id);

        const { data, error } = await query;
        if (error) throw error;
        result = { recurring_bookings: data, count: data?.length || 0 };
        break;
      }

      case "update_recurring_booking": {
        const { recurring_booking_id, ...updates } = params;
        if (!recurring_booking_id) throw new Error("Missing recurring_booking_id");

        const allowedFields = ["is_active", "frequency", "preferred_day", "preferred_time", "staff_id", "service_id", "total_amount", "notes"];
        const sanitizedUpdates: Record<string, any> = {};
        for (const key of allowedFields) {
          if (updates[key] !== undefined) sanitizedUpdates[key] = updates[key];
        }

        const { data, error } = await supabase
          .from("recurring_bookings")
          .update(sanitizedUpdates)
          .eq("id", recurring_booking_id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { recurring_booking: data, message: "Recurring booking updated successfully" };
        break;
      }

      // ============ TASKS & NOTES ============

      case "get_tasks": {
        const { type, completed } = params;
        let query = supabase
          .from("tasks_and_notes")
          .select("id, content, type, is_completed, due_date, created_at")
          .eq("organization_id", organization_id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (type) query = query.eq("type", type);
        if (completed !== undefined) query = query.eq("is_completed", completed);

        const { data, error } = await query;
        if (error) throw error;
        result = { tasks: data, count: data?.length || 0 };
        break;
      }

      // ============ TEAM MESSAGES ============

      case "get_team_messages": {
        const { limit = 50, channel } = params;
        let query = supabase
          .from("team_messages")
          .select("id, message, sender_type, sender_id, channel, booking_id, is_read, created_at")
          .eq("organization_id", organization_id)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (channel) query = query.eq("channel", channel);

        const { data, error } = await query;
        if (error) throw error;
        result = { messages: data, count: data?.length || 0 };
        break;
      }

      // ============ BUSINESS SETTINGS ============

      case "get_settings": {
        const { data, error } = await supabase
          .from("business_settings")
          .select("company_name, company_email, company_phone, company_address, company_city, company_state, company_zip, timezone, currency, logo_url, primary_color, accent_color, google_review_url, cancellation_policy, cancellation_window_hours, booking_buffer_minutes, minimum_notice_hours")
          .eq("organization_id", organization_id)
          .single();

        if (error) throw error;
        result = { settings: data };
        break;
      }

      case "update_settings": {
        const allowedFields = ["company_name", "company_email", "company_phone", "company_address", "company_city", "company_state", "company_zip", "timezone", "currency", "google_review_url", "cancellation_policy", "cancellation_window_hours", "booking_buffer_minutes", "minimum_notice_hours"];
        const sanitizedUpdates: Record<string, any> = {};
        for (const key of allowedFields) {
          if (params[key] !== undefined) sanitizedUpdates[key] = params[key];
        }

        const { data, error } = await supabase
          .from("business_settings")
          .update(sanitizedUpdates)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { settings: data, message: "Settings updated successfully" };
        break;
      }

      // ============ DASHBOARD / ANALYTICS ============

      case "get_dashboard_stats": {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Today's bookings
        const { data: todayBookings } = await supabase
          .from("bookings")
          .select("id, status, total_amount")
          .eq("organization_id", organization_id)
          .gte("scheduled_at", todayStart)
          .lt("scheduled_at", todayEnd);

        // This month's revenue
        const { data: monthBookings } = await supabase
          .from("bookings")
          .select("total_amount, status")
          .eq("organization_id", organization_id)
          .eq("status", "completed")
          .gte("scheduled_at", monthStart);

        // Total customers
        const { count: customerCount } = await supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization_id);

        // Active leads
        const { count: activeLeads } = await supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization_id)
          .in("status", ["new", "contacted", "qualified"]);

        // Active staff
        const { count: activeStaff } = await supabase
          .from("staff")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization_id)
          .eq("is_active", true);

        // Pending invoices
        const { data: pendingInvoices } = await supabase
          .from("invoices")
          .select("total_amount")
          .eq("organization_id", organization_id)
          .in("status", ["draft", "sent", "overdue"]);

        const monthRevenue = (monthBookings || []).reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
        const pendingInvoiceTotal = (pendingInvoices || []).reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0);

        result = {
          today: {
            bookings_count: todayBookings?.length || 0,
            bookings: todayBookings || [],
          },
          month: {
            revenue: monthRevenue,
            completed_bookings: monthBookings?.length || 0,
          },
          totals: {
            customers: customerCount || 0,
            active_leads: activeLeads || 0,
            active_staff: activeStaff || 0,
            pending_invoice_amount: pendingInvoiceTotal,
          },
        };
        break;
      }

      case "get_revenue_report": {
        const { from_date, to_date, group_by = "day" } = params;
        if (!from_date || !to_date) throw new Error("Missing from_date or to_date");

        const { data, error } = await supabase
          .from("bookings")
          .select("scheduled_at, total_amount, status, service_id, services(name)")
          .eq("organization_id", organization_id)
          .eq("status", "completed")
          .gte("scheduled_at", from_date)
          .lte("scheduled_at", to_date)
          .order("scheduled_at", { ascending: true });

        if (error) throw error;

        const totalRevenue = (data || []).reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
        result = {
          bookings: data,
          total_revenue: totalRevenue,
          booking_count: data?.length || 0,
          period: { from_date, to_date },
        };
        break;
      }

      // ============ SMS / EMAIL TRIGGERS ============

      case "send_sms": {
        const { phone_number, message } = params;
        if (!phone_number || !message) throw new Error("Missing phone_number or message");

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const response = await fetch(`${supabaseUrl}/functions/v1/send-openphone-sms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: phone_number,
            message: String(message).slice(0, 1600),
            organization_id,
          }),
        });

        const smsResult = await response.json();
        result = { sms_result: smsResult, message: "SMS send attempted" };
        break;
      }

      case "send_review_request": {
        const { customer_id, booking_id } = params;
        if (!customer_id) throw new Error("Missing customer_id");

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const response = await fetch(`${supabaseUrl}/functions/v1/send-review-request-sms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id,
            booking_id: booking_id || null,
            organization_id,
          }),
        });

        const reviewResult = await response.json();
        result = { review_result: reviewResult, message: "Review request send attempted" };
        break;
      }

      // ============ SEARCH ============

      case "search": {
        const { query: searchQuery, limit = 20 } = params;
        if (!searchQuery) throw new Error("Missing query");

        const searchTerm = String(searchQuery).slice(0, 100);

        const [customersRes, leadsRes, bookingsRes] = await Promise.all([
          supabase
            .from("customers")
            .select("id, first_name, last_name, email, phone")
            .eq("organization_id", organization_id)
            .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
            .limit(limit),
          supabase
            .from("leads")
            .select("id, name, email, phone, status")
            .eq("organization_id", organization_id)
            .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
            .limit(limit),
          supabase
            .from("bookings")
            .select("id, booking_number, scheduled_at, status, customers(first_name, last_name)")
            .eq("organization_id", organization_id)
            .or(`address.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
            .limit(limit),
        ]);

        result = {
          customers: customersRes.data || [],
          leads: leadsRes.data || [],
          bookings: bookingsRes.data || [],
        };
        break;
      }

      // ============ CUSTOMER BOOKING HISTORY ============

      case "get_customer_history": {
        const { customer_id } = params;
        if (!customer_id) throw new Error("Missing customer_id");

        const [bookingsRes, invoicesRes, loyaltyRes] = await Promise.all([
          supabase
            .from("bookings")
            .select("id, booking_number, scheduled_at, status, payment_status, total_amount, services(name), staff(name)")
            .eq("organization_id", organization_id)
            .eq("customer_id", customer_id)
            .order("scheduled_at", { ascending: false })
            .limit(50),
          supabase
            .from("invoices")
            .select("id, invoice_number, total_amount, status, due_date, created_at")
            .eq("organization_id", organization_id)
            .eq("customer_id", customer_id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("customer_loyalty")
            .select("points, lifetime_points, tier")
            .eq("customer_id", customer_id)
            .maybeSingle(),
        ]);

        const totalSpent = (bookingsRes.data || [])
          .filter((b: any) => b.status === "completed")
          .reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);

        result = {
          bookings: bookingsRes.data || [],
          invoices: invoicesRes.data || [],
          loyalty: loyaltyRes.data || null,
          total_spent: totalSpent,
          total_bookings: bookingsRes.data?.length || 0,
        };
        break;
      }

      // ============ ADDITIONAL CHARGES ============

      case "get_additional_charges": {
        const { booking_id } = params;
        if (!booking_id) throw new Error("Missing booking_id");

        const { data, error } = await supabase
          .from("additional_charges")
          .select("id, charge_name, charge_amount, description, created_at")
          .eq("booking_id", booking_id)
          .eq("organization_id", organization_id);

        if (error) throw error;
        result = { charges: data, count: data?.length || 0 };
        break;
      }

      case "add_additional_charge": {
        const { booking_id, charge_name, charge_amount, description } = params;
        if (!booking_id || !charge_name || !charge_amount) throw new Error("Missing booking_id, charge_name, or charge_amount");

        const { data, error } = await supabase
          .from("additional_charges")
          .insert({
            booking_id,
            organization_id,
            charge_name: String(charge_name).slice(0, 100),
            charge_amount,
            description: description ? String(description).slice(0, 500) : null,
          })
          .select()
          .single();

        if (error) throw error;
        result = { charge: data, message: "Additional charge added" };
        break;
      }

      // ============ DISCOUNTS ============

      case "get_discounts": {
        const { data, error } = await supabase
          .from("discounts")
          .select("*")
          .eq("organization_id", organization_id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        result = { discounts: data, count: data?.length || 0 };
        break;
      }

      // ============ BOOKING PHOTOS ============

      case "get_booking_photos": {
        const { booking_id } = params;
        if (!booking_id) throw new Error("Missing booking_id");

        const { data, error } = await supabase
          .from("booking_photos")
          .select("id, photo_url, photo_type, caption, staff_id, created_at")
          .eq("booking_id", booking_id)
          .eq("organization_id", organization_id);

        if (error) throw error;
        result = { photos: data, count: data?.length || 0 };
        break;
      }

      // ============ AVAILABLE ACTIONS ============

      case "list_actions": {
        result = {
          customers: [
            "get_customers - List/search customers (params: limit, offset, search, status)",
            "get_customer - Get single customer (params: customer_id)",
            "create_customer - Create customer (params: first_name, last_name, email, phone, address, city, state, zip_code, notes)",
            "update_customer - Update customer (params: customer_id, + fields)",
            "delete_customer - Delete customer (params: customer_id)",
            "get_customer_history - Full customer history with bookings, invoices, loyalty (params: customer_id)",
          ],
          bookings: [
            "get_bookings - List bookings (params: limit, offset, status, customer_id, staff_id, from_date, to_date)",
            "get_booking - Get single booking (params: booking_id)",
            "create_booking - Create booking (params: customer_id, scheduled_at, service_id, staff_id, duration, address, city, state, zip_code, notes, total_amount, frequency, extras)",
            "update_booking - Update booking (params: booking_id, + fields)",
            "cancel_booking - Cancel a booking (params: booking_id)",
            "complete_booking - Mark booking completed (params: booking_id, payment_status)",
            "get_additional_charges - Get extra charges on a booking (params: booking_id)",
            "add_additional_charge - Add extra charge (params: booking_id, charge_name, charge_amount, description)",
            "get_booking_photos - Get photos for a booking (params: booking_id)",
          ],
          leads: [
            "get_leads - List/search leads (params: limit, offset, status, source, search)",
            "create_lead - Create lead (params: name, email, phone, source, notes, service_interest, estimated_value)",
            "update_lead - Update lead (params: lead_id, + fields)",
            "delete_lead - Delete lead (params: lead_id)",
            "convert_lead_to_customer - Convert lead to customer (params: lead_id)",
          ],
          staff: [
            "get_staff - List staff (params: include_inactive)",
            "get_staff_member - Get staff details (params: staff_id)",
            "get_staff_schedule - Get staff bookings in date range (params: staff_id, from_date, to_date)",
          ],
          services: [
            "get_services - List services (params: include_inactive)",
          ],
          invoices: [
            "get_invoices - List invoices (params: limit, offset, status, customer_id)",
            "get_invoice - Get single invoice (params: invoice_id)",
          ],
          quotes: [
            "get_quotes - List quotes (params: limit, offset, status, customer_id)",
            "create_quote - Create quote (params: customer_id, lead_id, service_id, total_amount, subtotal, notes, valid_until, address, bedrooms, bathrooms, square_footage, extras)",
            "update_quote - Update quote (params: quote_id, + fields)",
          ],
          expenses: [
            "get_expenses - List expenses (params: limit, offset, category, from_date, to_date)",
            "create_expense - Create expense (params: description, amount, category, vendor, expense_date)",
            "update_expense - Update expense (params: expense_id, + fields)",
            "delete_expense - Delete expense (params: expense_id)",
          ],
          recurring: [
            "get_recurring_bookings - List recurring bookings (params: customer_id, active_only)",
            "update_recurring_booking - Update recurring booking (params: recurring_booking_id, + fields)",
          ],
          tasks: [
            "get_tasks - List tasks/notes (params: type, completed)",
          ],
          messages: [
            "get_team_messages - List team messages (params: limit, channel)",
          ],
          settings: [
            "get_settings - Get business settings",
            "update_settings - Update business settings (params: company_name, company_email, company_phone, etc.)",
          ],
          analytics: [
            "get_dashboard_stats - Today's stats, monthly revenue, totals",
            "get_revenue_report - Revenue for date range (params: from_date, to_date)",
          ],
          communication: [
            "send_sms - Send SMS via OpenPhone (params: phone_number, message)",
            "send_review_request - Send review request SMS (params: customer_id, booking_id)",
          ],
          other: [
            "search - Cross-search customers, leads & bookings (params: query, limit)",
            "get_discounts - List all discounts",
          ],
          note: "All requests require api_key and organization_id in the body.",
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Use action 'list_actions' to see available operations.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`[lindy-crm-api] Action: ${action}, Org: ${organization_id}`);

    return new Response(
      JSON.stringify({ success: true, action, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[lindy-crm-api] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
