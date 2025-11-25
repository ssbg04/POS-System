import { useAuthContext } from "../context/AuthContext";

export const useInventory = () => {
    const { user } = useAuthContext();

    const updateInventory = async (product_id, action, quantity, remarks) => {
        if (!user?.id) throw new Error("User not logged in");

        const res = await createInventoryLogAPI({
            product_id,
            user_id: user.user_id, // <-- must send this
            action,
            quantity,
            remarks,
        });

        return res;
    };

    return { updateInventory };
};
export default useInventory;