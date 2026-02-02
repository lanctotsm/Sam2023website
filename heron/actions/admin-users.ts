import { deleteUser, getUserById } from "@/services/admin-users";

export async function removeUser(id: number) {
  const row = await getUserById(id);
  if (!row) {
    throw new Error("user not found");
  }
  if (row.isBaseAdmin) {
    throw new Error("cannot remove base user");
  }

  await deleteUser(id);
}
