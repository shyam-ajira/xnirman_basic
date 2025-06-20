import frappe
from frappe.model.document import Document

class CharKilla(Document):

    def on_update(self):
        """ This function triggers after updating the document """
        self.update_site_id()

    def update_site_id(self):
        """ Update the Site ID field based on Land details """
        if self.charkila_land:  # Ensure `charkila_land` is set
            site_visit = frappe.db.get_value("Site Visit", {"site_land": self.charkila_land}, "name")

            if site_visit:
                if self.site_id != site_visit:  # Update only if different
                    self.db_set("site_id", site_visit)  # Update without triggering recursion
            else:
                if self.site_id:  # Only update if necessary
                    self.db_set("site_id", None)
