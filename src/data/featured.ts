export interface FeaturedProduct {
    category: string;
    name: string;
    description: string;
    price: string;
    image: string;
}

export const featuredProducts: FeaturedProduct[] = [
    {
        category: "Lamps",
        name: "Modern Space Astronaut Side Table with Moon Lamp",
        description: "A stunning astronaut-themed side table featuring a glowing moon lamp, perfect for adding a cosmic touch to any room.",
        price: "₱8,850",
        image: "/images/ASTROGOLD.png",
    },
    {
        category: "Figurines",
        name: "Modern Leopard Decor Sculpture with Night Lamp",
        description: "An elegant leopard sculpture that doubles as a night lamp, blending artistry with ambient lighting.",
        price: "₱3,499",
        image: "/images/LEOPARD.png",
    },
    {
        category: "Lamps",
        name: "Nordic Minimalist Thinking Human Sculpture with Moon Night Lamp",
        description: "A contemplative human figure holding a luminous moon, bringing minimalist Nordic charm to your space.",
        price: "₱2,499",
        image: "/images/THINKING.png",
    },
    {
        category: "Figurines",
        name: "The Stag Deer Guardian of the Forest Figurine",
        description: "A majestic stag deer figurine symbolizing strength and grace, a statement piece for any shelf or table.",
        price: "₱1,795",
        image: "/images/STAGWHITE.png",
    },
    {
        category: "Tray",
        name: "Modern Bear Floor Standing Decor Tray with Moon Lamp",
        description: "A charming bear figure holding a tray and moon lamp, combining functional storage with decorative art.",
        price: "₱799",
        image: "/images/BEARGOLD.png",
    },
];
