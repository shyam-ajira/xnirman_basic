frappe.provide("frappe.utils");

// Set map defaults
frappe.utils.map_defaults = {
    center: [27.68766846350236, 85.33657618159967],  // Kathmandu, Nepal (custom coordinates)
    zoom: 20,
    tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
        attribution: '&copy; <a href="http://osm.org/copyright">Ajira Group</a> contributors',
    },
    image_path: "/assets/frappe/images/leaflet/marker-icon.png",
};

// To test and ensure it's working correctly, you can log the map defaults
console.log(frappe.utils.map_defaults);
