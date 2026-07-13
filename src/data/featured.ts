export interface FeaturedProduct {
    category: string;
    name: string;
    description: string;
    price: string;
    image: string;
}

export const featuredProducts: FeaturedProduct[] = [
    {
        category: "figurines",
        name: "Elegant Lady Justice Goddess of Law Decor Sculpture ",
        description: "",
        price: "₱1,299",
        image: "/images/FEATURED_1.jpg",
    },
    {
        category: "Lamps",
        name: "Modern Leopard Decor Sculpture with Night Lamp",
        description: "",
        price: "₱3,499",
        image: "/images/FEATURED_2.jpg",
    },
    {
        category: "Lamps",
        name: "Nordic Minimalist Thinking Human Sculpture with Moon Night Lamp",
        description: "",
        price: "₱2,499",
        image: "/images/FEATURED_3.jpg",
    },
    {
        category: "Figurines",
        name: "Abstract Praying Head Sculpture in Gold and Black",
        description: "",
        price: "₱2,499",
        image: "/images/FEATURED_4.png",
    },
    {
        category: "Tray and Holders",
        name: "Elegant Wine Holder ",
        description: "",
        price: "₱1,895",
        image: "/images/FEATURED_5.png",
    },
];
