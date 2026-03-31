import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TermsOfServiceDialogProps {
  children: React.ReactNode;
}

export function TermsOfServiceDialog({ children }: TermsOfServiceDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Terms of Service</DialogTitle>
        </DialogHeader>
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
          <h3 className="text-foreground text-lg font-semibold mt-4">1. Terms</h3>
          <p>
            By accessing this web site, you are agreeing to be bound by these web site Terms and Conditions of Use, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this web site are protected by applicable copyright and trade mark law.
          </p>

          <h3 className="text-foreground text-lg font-semibold mt-6">2. Use License</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Permission is granted to temporarily download one copy of the materials (information or software) on WE DETAIL NC's web site for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              <ol className="list-decimal pl-6 mt-2 space-y-1">
                <li>modify or copy the materials;</li>
                <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                <li>attempt to decompile or reverse engineer any software contained on WE DETAIL NC's web site;</li>
                <li>remove any copyright or other proprietary notations from the materials; or</li>
                <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
              </ol>
            </li>
            <li>
              This license shall automatically terminate if you violate any of these restrictions and may be terminated by WE DETAIL NC at any time. Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.
            </li>
          </ol>

          <h3 className="text-foreground text-lg font-semibold mt-6">3. Disclaimer</h3>
          <ol className="list-decimal pl-6">
            <li>
              The materials on WE DETAIL NC's web site are provided "as is". WE DETAIL NC makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. Further, WE DETAIL NC does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its Internet web site or otherwise relating to such materials or on any sites linked to this site.
            </li>
          </ol>

          <h3 className="text-foreground text-lg font-semibold mt-6">4. Limitations</h3>
          <p>
            In no event shall WE DETAIL NC or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption,) arising out of the use or inability to use the materials on WE DETAIL NC's Internet site, even if WE DETAIL NC or a WE DETAIL NC authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
          </p>

          <h3 className="text-foreground text-lg font-semibold mt-6">5. Revisions and Errata</h3>
          <p>
            The materials appearing on WE DETAIL NC's web site could include technical, typographical, or photographic errors. WE DETAIL NC does not warrant that any of the materials on its web site are accurate, complete, or current. WE DETAIL NC may make changes to the materials contained on its web site at any time without notice. WE DETAIL NC does not, however, make any commitment to update the materials.
          </p>

          <h3 className="text-foreground text-lg font-semibold mt-6">6. Links</h3>
          <p>
            WE DETAIL NC has not reviewed all of the sites linked to its Internet web site and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by WE DETAIL NC of the site. Use of any such linked web site is at the user's own risk.
          </p>

          <h3 className="text-foreground text-lg font-semibold mt-6">7. Site Terms of Use Modifications</h3>
          <p>
            WE DETAIL NC may revise these terms of use for its web site at any time without notice. By using this web site you are agreeing to be bound by the then current version of these Terms and Conditions of Use.
          </p>

          <h3 className="text-foreground text-lg font-semibold mt-6">8. Governing Law</h3>
          <p>
            Any claim relating to WE DETAIL NC's web site shall be governed by the laws of the State of Florida without regard to its conflict of law provisions.
          </p>
          <p className="mt-4">
            General Terms and Conditions applicable to Use of a Web Site.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
