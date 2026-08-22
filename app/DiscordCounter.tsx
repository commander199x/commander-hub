"use client";

import { useEffect, useState } from "react";

export default function DiscordCounter() {
  const [members, setMembers] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://discord.com/api/guilds/1483950869572751514/widget.json")
      .then((res) => res.json())
      .then((data) => {
        setMembers(data.presence_count);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="text-white text-xl">
      {members === null ? "Loading Discord..." : `🔥 ${members} Members Online`}
    </div>
  );
}