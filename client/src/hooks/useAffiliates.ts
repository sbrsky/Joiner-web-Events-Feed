import { useState, useEffect } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Affiliate {
    id: string;
    name: string;
    urlStartsWith: string;
}

export function useAffiliates() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "affiliates"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Affiliate[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            } as Affiliate));
            setAffiliates(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching affiliates:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { affiliates, loading };
}
