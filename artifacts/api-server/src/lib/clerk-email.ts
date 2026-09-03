type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkUserPayload = {
  id: string;
  primary_email_address_id: string | null;
  email_addresses: ClerkEmailAddress[];
};

export async function primaryEmailForUser(
  clerkUserId: string,
): Promise<string | null> {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) return null;
  const response = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as ClerkUserPayload;
  const primary = user.email_addresses.find(
    (entry) => entry.id === user.primary_email_address_id,
  );
  const email = primary?.email_address ?? user.email_addresses[0]?.email_address;
  return email ? email.trim().toLowerCase() : null;
}
