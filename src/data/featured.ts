export interface FeaturedProduct {
    category: string;
    name: string;
    description: string;
    price: string;
    image: string;
    fit?: "cover" | "contain";
}

export const featuredProducts: FeaturedProduct[] = [
    {
        category: "figurines",
        name: "1. Elegant Lady Justice Goddess of Law Decor Sculpture ",
        description: "",
        price: "₱1,299",
        image: "/images/FEATURED_1.jpg",
    },
    {
        category: "Lamps",
        name: "2. Modern Leopard Decor Sculpture with Night Lamp",
        description: "",
        price: "₱3,499",
        image: "/images/FEATURED_2.jpg",
        fit: "contain",
    },
    {
        category: "Lamps",
        name: "3. Nordic Minimalist Thinking Human Sculpture with Moon Night Lamp",
        description: "",
        price: "₱2,499",
        image: "/images/FEATURED_3.jpg",
        fit: "contain",
    },
    {
        category: "Figurines",
        name: "4. Abstract Praying Head Sculpture in Gold and Black",
        description: "",
        price: "₱2,499",
        image: "/images/FEATURED_4.png",
    },
    {
        category: "Tray and Holders",
        name: "5. Elegant Wine Holder ",
        description: "",
        price: "₱1,895",
        image: "/images/FEATURED_5_UPDATED.png",
        fit: "contain",     
    },  
];
