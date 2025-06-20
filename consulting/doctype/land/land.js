// Copyright (c) 2025, Ajira and contributors
// For license information, please see license.txt

frappe.ui.form.on('Land', {
    // When the form is loaded or refreshed
    refresh(frm) {
        frm.clear_custom_buttons();
        if (!frm.is_new()) {
            frm.add_custom_button(__('Create Site Visit'), () => {
                frappe.new_doc('Site Visit', {
                    site_land: frm.doc.name  // Pre-fill the site_land field
                });
            }, __('Create'));
        }
            

        // Make Land Owner read-only after saving

        if (!frm.is_new()) {

            frm.set_df_property('land_owner', 'read_only', 1);

        } else {

            frm.set_df_property('land_owner', 'read_only', 0);

        }
        // Fetch the lead_name from the Lead doctype and set it to focal_person_name
        toggle_fields(frm); // Add this line
        frappe.db.get_value('Lead', frm.doc.focal_person, 'lead_name', function(value) {
            if (value) {
                frm.add_fetch('focal_person', 'lead_name', 'focal_person_name');
                frm.set_df_property('focal_person_name', 'read_only', true);
            }
            toggle_fields(frm);
        });

        // Set query for district field
        frm.set_query('district', function() {
            return {
                filters: {
                    active: 1 // Use 'active' instead of 'is_active'
                }
            };
        });

        // Ensure the area sections toggle based on unit_type value
        if (frm.doc.unit_type) {
            frm.trigger('toggle_area_sections');
        } else {
            // Hide both area-specific sections if no value is selected
            frm.set_df_property('rapd_section', 'hidden', 1);
            frm.set_df_property('bkd_section', 'hidden', 1);
        }

        // Initially hide Municipality and Ward fields if District is not selected
        if (!frm.doc.district) {
            frm.set_df_property('municipality', 'hidden', true);
            frm.set_df_property('ward', 'hidden', true);
        } else if (!frm.doc.municipality) {
            frm.set_df_property('ward', 'hidden', true);
        }
    },

    // When the "focal_person" field is changed
    focal_person(frm) {
        if (frm.doc.focal_person) {
            frappe.db.get_value('Lead', frm.doc.focal_person, ['lead_name', 'mobile_no'], function(value) {
                if (value) {
                    frm.set_value('focal_person_name', value.lead_name);
                    frm.set_value('focal_person_contact', value.mobile_no);
                    
                    // Update land_owner_name if land_owner is "Self"
                    if (frm.doc.land_owner === 'Self') {
                        frm.set_value('land_owner_name', value.lead_name);
                        frm.set_value('land_owner_contact', value.mobile_no);
                    }
                }
            });
        } else {
            frm.set_value('focal_person_name', null);
            frm.set_value('focal_person_contact', null);
            if (frm.doc.land_owner === 'Self') {
                frm.set_value('land_owner_name', null);
                frm.set_value('land_owner_contact', null);
            }
        }
        toggle_fields(frm);
    },

    // When the "land_owner" field is changed
    land_owner(frm) {
        if (frm.doc.land_owner !== 'Self') {
            frm.set_value('land_owner_name', ''); // Clear on change (except for 'Self')
            frm.set_value('land_owner_contact', '');
        }
        toggle_fields(frm);
    },

    // When the "district" field is changed
    district(frm) {
        if (frm.doc.district) {
            // Clear the Municipality and Ward fields
            frm.set_value('municipality', null);
            frm.set_value('ward', null);

            // Set a dynamic query on the Municipality field based on selected District
            frm.set_query('municipality', function() {
                return {
                    filters: {
                        district: frm.doc.district,
                        active: 1 // Ensure only active municipalities are shown
                    }
                };
            });

            // Show Municipality field
            frm.set_df_property('municipality', 'hidden', false);

            // Hide Ward field until Municipality is selected
            frm.set_df_property('ward', 'hidden', true);
        } else {
            // Clear and hide Municipality and Ward fields if District is not selected
            frm.set_value('municipality', null);
            frm.set_value('ward', null);
            frm.set_df_property('municipality', 'hidden', true);
            frm.set_df_property('ward', 'hidden', true);
        }
    },

    // When the "municipality" field is changed
    municipality(frm) {
        if (frm.doc.municipality) {
            // Show the Ward field
            frm.set_df_property('ward', 'hidden', false);
        } else {
            // Clear and hide the Ward field if Municipality is not selected
            frm.set_value('ward', null);
            frm.set_df_property('ward', 'hidden', true);
        }
    },

    // Trigger when unit_type (Area Type) changes
    unit_type(frm) {
        // Clear all area-related fields
        frm.trigger('clear_area_fields');

        // Trigger the toggle for area sections
        frm.trigger('toggle_area_sections');
    },

    // Toggle the visibility of area-specific sections
    toggle_area_sections(frm) {
        if (frm.doc.unit_type === "Hilly Area") {
            frm.set_df_property('rapd_section', 'hidden', 0);
            frm.set_df_property('bkd_section', 'hidden', 1);
        } else if (frm.doc.unit_type === "Terai Area") {
            frm.set_df_property('rapd_section', 'hidden', 1);
            frm.set_df_property('bkd_section', 'hidden', 0);
        } else {
            // Hide both sections if no type is selected
            frm.set_df_property('rapd_section', 'hidden', 1);
            frm.set_df_property('bkd_section', 'hidden', 1);
        }

        // Ensure the Square Feet/Meter section is always visible
        frm.set_df_property('sq_feet_meter_section', 'hidden', 0);
    },

    // Clear all area-related fields
    clear_area_fields(frm) {
        // Clear fields for R-A-P-D (Hilly Area)
        frm.set_value('ropani', null);
        frm.set_value('aana', null);
        frm.set_value('paisa', null);
        frm.set_value('daam', null);

        // Clear fields for B-K-D (Terai Area)
        frm.set_value('bigha', null);
        frm.set_value('kattha', null);
        frm.set_value('dhur', null);

        // Clear fields for Square Feet/Meter
        frm.set_value('sq_feet', null);
        frm.set_value('sq_mtr', null);
    },

    // Trigger calculations when R-A-P-D fields change
    ropani(frm) {
        frm.trigger('calculate_area_from_rapd');
    },
    aana(frm) {
        frm.trigger('calculate_area_from_rapd');
    },
    paisa(frm) {
        frm.trigger('calculate_area_from_rapd');
    },
    daam(frm) {
        frm.trigger('calculate_area_from_rapd');
    },

    // Calculate area in square feet and square meters
    calculate_area_from_rapd(frm) {
        // Get input values
        let ropani = frm.doc.ropani || 0;
        let aana = frm.doc.aana || 0;
        let paisa = frm.doc.paisa || 0;
        let daam = frm.doc.daam || 0;

        // Calculate total aana
        let total_aana = ( ropani * 16 ) + aana + ( paisa / 4 ) + ( daam / 16 );
        console.log(total_aana);

        // Calculate Square Feet from Daam
        let calculated_sq_feet = total_aana * 342.25;
        console.log(calculated_sq_feet);

        // Calculate Square Meter from Square Feet
        let calculated_sq_mtr = calculated_sq_feet / 10.76391;
        console.log(calculated_sq_mtr);
    
        // Set calculated values
        frm.set_value('sq_feet', Math.round(calculated_sq_feet*10000)/10000);
        frm.set_value('sq_mtr', Math.round(calculated_sq_mtr*10000)/10000);
    },

    // Trigger calculations for B-K-D fields
    bigha(frm) {
        calculate_area_from_bkd(frm);
    },
    kattha(frm) {
        calculate_area_from_bkd(frm);
    },
    dhur(frm) {
        calculate_area_from_bkd(frm);
    },

    // Trigger reverse calculations for square feet and square meter
    // sq_feet(frm) {
    //     calculate_reverse(frm);
    // },
    // sq_mtr(frm) {
    //     calculate_reverse(frm);
    // }
});

// Function to calculate total area from B-K-D fields
function calculate_area_from_bkd(frm) {
    const kattha_to_sqft = 3645;
    const bigha_to_sqft = kattha_to_sqft * 20;
    const dhur_to_sqft = kattha_to_sqft / 20;
    const sqft_to_sqm = 0.092903;

    let bigha = frm.doc.bigha || 0;
    let kattha = frm.doc.kattha || 0;
    let dhur = frm.doc.dhur || 0;

    let total_sqft = (bigha * bigha_to_sqft) +
                     (kattha * kattha_to_sqft) +
                     (dhur * dhur_to_sqft);

    let total_sqm = total_sqft * sqft_to_sqm;

    frm.set_value('sq_feet', total_sqft);
    frm.set_value('sq_mtr', Math.round(total_sqm*10000)/10000);
}

function toggle_fields(frm) {
    if (frm.doc.land_owner === 'Self') {
        // Always set these values regardless of whether focal_person_name exists yet
        frm.set_value('land_owner_name', frm.doc.focal_person_name || '');
        frm.set_value('land_owner_contact', frm.doc.focal_person_contact || '');

        // Make these fields visible but read-only
        frm.set_df_property('land_owner_name', 'hidden', false);
        frm.set_df_property('land_owner_name', 'read_only', true);
        frm.set_df_property('land_owner_contact', 'hidden', false);
        frm.set_df_property('land_owner_contact', 'read_only', true);

        // Hide relation field
        frm.set_df_property('relation_with_fp', 'hidden', true);
        frm.set_df_property('relation_with_fp', 'reqd', false);
        frm.set_df_property('focal_person_contact', 'hidden', true);
    } 
    else if (frm.doc.land_owner === 'Relative') {
        // Handle Relative case
        frm.set_df_property('land_owner_name', 'hidden', false);
        frm.set_df_property('land_owner_name', 'read_only', false);
        frm.set_df_property('relation_with_fp', 'hidden', false);
        frm.set_df_property('relation_with_fp', 'reqd', true);
        frm.set_df_property('land_owner_contact', 'hidden', true);
        frm.set_df_property('focal_person_contact', 'hidden', false);

    } 
    else {
        // Default case
        frm.set_df_property('land_owner_name', 'hidden', false);
        frm.set_df_property('land_owner_name', 'read_only', false);
        frm.set_df_property('relation_with_fp', 'hidden', true);
        frm.set_df_property('relation_with_fp', 'reqd', false);
        frm.set_df_property('land_owner_contact', 'hidden', true);
    }
}
// Ensure Land Owner Name is not cleared on save
frappe.ui.form.on('Land', {
    validate(frm) {
        // Ensure land_owner_name is populated when land_owner is "Self"
        if (frm.doc.land_owner === 'Self') {
            if (!frm.doc.land_owner_name && frm.doc.focal_person_name) {
                frm.set_value('land_owner_name', frm.doc.focal_person_name);
            }
            if (!frm.doc.land_owner_contact && frm.doc.focal_person_contact) {
                frm.set_value('land_owner_contact', frm.doc.focal_person_contact);
            }
        }
        
        // Validate required fields
        if (frm.doc.land_owner === 'Relative' && !frm.doc.land_owner_name) {
            frappe.throw(__('Please enter the Land Owner Name.'));
        }
        if (frm.doc.land_owner === 'Relative' && !frm.doc.relation_with_fp) {
            frappe.throw(__('Please specify the relation with focal person.'));
        }
    }
});


frappe.ui.form.on('Land', {
    refresh: function(frm) {
        // Show Land Owner Details
        if(frm.doc.land_owner_name) {
            frm.set_df_property('land_owner_name', 'hidden', 0);
            frm.set_df_property('land_owner_contact', 'hidden', 0);
        }

        // Load Char Killa Details with S.No
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Char Killa',
                filters: { charkila_land: frm.doc.name },
                fields: ['name', 'direction', 'landscape_type', 'kitta_no', 'charkila_land_owner', 'site_id', 'road_name', 'house_owner_name', 'empty_land_owner_name', 'river_name', 'rajkulo_name', 'public_property_owner_name']
            },
            callback: function(response) {
                let charKillaHtml = '';
                const charKillas = response.message;

                if(charKillas.length > 0) {
                    charKillaHtml = `
                        <div class="row">
                            <div class="col-md-12">
                                <table class="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>S.No</th>
                                            <th>ID</th>
                                            <th>Direction</th>
                                            <th>Type</th>
                                            <th>Kitta No.</th>
                                            <th>Site Visit ID</th>
                                            <th>Name</th>
                                        </tr>
                                    </thead>
                                    <tbody>`;

                    let sno = 1; // Initialize serial number counter
                    charKillas.forEach(d => {
                        let displayName = d.charkila_land_owner || '-';  // Default to 'charkila_land_owner' if nothing else

                        // Check landscape type and select the corresponding name field
                        switch (d.landscape_type) {
                            case 'Road':
                                displayName = d.road_name || d.house_owner_name || d.empty_land_owner_name || d.river_name || d.rajkulo_name || d.public_property_owner_name || '-';
                                break;
                            case 'House':
                                displayName = d.house_owner_name || '-';
                                break;
                            case 'Empty Land':
                                displayName = d.empty_land_owner_name || '-';
                                break;
                            case 'River':
                                displayName = d.river_name || '-';
                                break;
                            case 'Raj-kulo':
                                displayName = d.rajkulo_name || '-';
                                break;
                            case 'Public Property':
                                displayName = d.public_property_owner_name || '-';
                                break;
                            default:
                                displayName = '-';
                        }

                        charKillaHtml += `
                            <tr>
                                <td>${sno}</td>
                                <td><a href="/app/char-killa/${d.name}">${d.name}</a></td>
                                <td>${d.direction || '-'}</td>
                                <td>${d.landscape_type}</td>
                                <td>${d.kitta_no || '-'}</td>
                                <td>${d.site_id || '-'}</td>
                                <td>${displayName}</td>
                            </tr>`;
                        sno++; // Increment serial number
                    });

                    charKillaHtml += `</tbody></table></div></div>`;
                } else {
                    charKillaHtml = '<p>No properties recorded</p>';
                }

                frm.fields_dict.char_killa_html.$wrapper.html(charKillaHtml);
            }
        });
    }
});
