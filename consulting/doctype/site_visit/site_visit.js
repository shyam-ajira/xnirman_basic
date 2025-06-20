frappe.ui.form.on('Site Visit', {
    refresh: function (frm) {
        console.log("Form refreshed - Site Visit");
        if (!frm.doc.gps_location) {
            // Set default location (Min Bhavan, Kathmandu)
            frm.set_value('gps_location', '27.686653, 85.336511');
        }
    },

    site_land: function (frm) {
        console.log("site_land field changed, selected land:", frm.doc.site_land);

        if (frm.doc.site_land) {
            // Fetch Focal Person, Land Owner, Land Location, and Land Owner status from Land doctype
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "Land",
                    filters: { name: frm.doc.site_land },
                    fieldname: [
                        "focal_person_name",
                        "land_owner_name",
                        "district",
                        "municipality",
                        "ward",
                        "land_owner", // Fetching land_owner to check if it's "Self"
                        "land_owner_contact" // Added this field to fetch directly
                    ]
                },
                callback: function (r) {
                    console.log("Frappe call response (Land):", r);

                    if (r.message) {
                        let focal_person = r.message.focal_person_name || "";
                        let land_owner_name = r.message.land_owner_name || "";
                        let district = r.message.district || "";
                        let municipality = r.message.municipality || "";
                        let ward = r.message.ward || "";
                        let land_owner = r.message.land_owner || "";
                        let land_owner_contact = r.message.land_owner_contact || "";

                        console.log("Fetched land_owner:", land_owner);

                        // Set values in Site Visit doctype
                        frm.set_value("focal_person_name", focal_person);
                        frm.set_value("land_owner_name", land_owner_name);
                        frm.set_value("district", district);
                        frm.set_value("municipality", municipality);
                        frm.set_value("ward", ward);
                        frm.set_value("land_owner_contact", land_owner_contact);

                        // Make fields read-only after auto-updating
                        ["focal_person_name", "land_owner_name", "district", "municipality", "ward", "land_owner_contact"].forEach(field => {
                            frm.set_df_property(field, "read_only", 1);
                        });
                        frm.set_df_property("site_land", "read_only", 1);

                        // Handle field visibility based on land_owner
                        if (land_owner === "Self") {
                            // Show Land Owner Name and Land Owner Contact
                            frm.toggle_display("land_owner_name", true);
                            frm.toggle_display("land_owner_contact", true);
                            frm.toggle_display("focal_person_name", false);
                            frm.toggle_display("contact", false);
                        } else if (land_owner === "Relative") {
                            // Show Focal Person Name and Focal Person Contact
                            frm.toggle_display("focal_person_name", true);
                            frm.toggle_display("contact", true);
                            frm.toggle_display("land_owner_name", false);
                            frm.toggle_display("land_owner_contact", false);
                            
                            // Fetch contact only if focal_person is available
                            if (focal_person) {
                                fetchFocalPersonContact(frm, focal_person);
                            }
                        }
                    } else {
                        console.log("No data found for selected Land.");
                    }
                }
            });
        } else {
            console.log("No land selected, clearing fields.");

            // Clear fields if no Land is selected
            ["focal_person_name", "land_owner_name", "contact", "district", "municipality", "ward", "land_owner_contact"].forEach(field => {
                frm.set_value(field, "");
                frm.set_df_property(field, "read_only", 0);
            });
            
            // Reset field visibility
            frm.toggle_display("land_owner_name", true);
            frm.toggle_display("land_owner_contact", true);
            frm.toggle_display("focal_person_name", true);
            frm.toggle_display("contact", true);
        }
    }
});

// Simplified function to fetch Focal Person Contact from Lead
function fetchFocalPersonContact(frm, focal_person) {
    console.log("Fetching contact for focal person:", focal_person);

    frappe.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Lead",
            filters: { lead_name: focal_person },
            fieldname: ["mobile_no"]
        },
        callback: function (r) {
            console.log("Frappe call response (Lead Contact):", r);

            if (r.message && r.message.mobile_no) {
                let contact_number = r.message.mobile_no.trim();
                console.log("Fetched contact:", contact_number);
                frm.set_value("contact", contact_number);
                frm.set_df_property("contact", "read_only", 1);
            } else {
                console.log("No contact found for focal person.");
                frm.set_value("contact", "");
            }
        }
    });
}