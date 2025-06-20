// Copyright (c) 2025, Ajira and contributors
// For license information, please see license.txt

frappe.ui.form.on("Char Killa", {
    refresh(frm) {
        frm.set_df_property("charkila_land_owner", "read_only", 1);
        frm.set_df_property("charkila_land", "read_only", 1);
        
        // Add a custom button to go back to Land record if linked
        if (frm.doc.charkila_land && !frm.is_new()) {
            frm.add_custom_button(__('Back to Land'), function() {
                frappe.set_route('Form', 'Land', frm.doc.charkila_land);
            }, __('Navigation'));
        }
    },

    charkila_land(frm) {
        if (frm.doc.charkila_land) {
            frappe.db.get_value("Land", frm.doc.charkila_land, "land_owner_name")
                .then(r => {
                    if (r.message) {
                        frm.set_value("charkila_land_owner", r.message.land_owner_name);
                    }
                });
        }
    },
    
    // Add this new after_save handler
    after_save(frm) {
        // Redirect to the linked Land record after saving
        if (frm.doc.charkila_land) {
            frappe.set_route('Form', 'Land', frm.doc.charkila_land);
        }
    }
});