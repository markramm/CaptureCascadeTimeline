
// SVG Paths for Lucide Icons (24x24 viewbox usually)
// We will scale them down to fit in nodes.

export const NODE_ICONS = {
    legislative: "M8 10h12 M8 14h12 M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z", // Scroll-like (FileText)
    judicial: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z", // Grid/Gavel abstraction (LayoutGrid for now, or Gavel path if complex)
    financial: "M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", // Dollar Sign
    corporate: "M3 21h18 M5 21V7l8-4 8 4v14 M8 14v-2 M8 18v-2 M16 14v-2 M16 18v-2", // Landmark/Building
    political: "M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z M19 21v-2a7 7 0 0 0-14 0v2", // User/Person
    cultural: "M8.5 2h7A5.5 5.5 0 0 1 21 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-7A5.5 5.5 0 0 1 3 16.5v-9A5.5 5.5 0 0 1 8.5 2z M8 11h8 M8 15h8 M11 7h2", // Book/Culture
    other: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" // Circle
};

export const getIconPath = (type?: string) => {
    return NODE_ICONS[type as keyof typeof NODE_ICONS] || NODE_ICONS.other;
};
