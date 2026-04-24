import { useEffect, useState } from "react";

export const useUser = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        const res = await fetch(
          `${"https://kbetz.onrender.com"}/me`,
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.log("User fetch error:", err);
      }
    };

    fetchUser();
  }, []);

  return user;
};