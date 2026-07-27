import { NextResponse } from "next/server";

export async function GET() {

  const serverID = "1483950869572751514";

  const response = await fetch(
    `https://discord.com/api/guilds/${serverID}/widget.json`,
    {
      cache: "no-store",
    }
  );


  if (!response.ok) {
    return NextResponse.json(
      { error: "Discord server not found" },
      { status: 500 }
    );
  }


  const data = await response.json();


  return NextResponse.json({
    name: data.name,
    members: data.presence_count ?? 0,
  });

}