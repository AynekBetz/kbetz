import { useEffect, useState } from "react";

export const useUser = () => {
const [user, setUser] = useState<any>(null);

useEffect(() => {
const fetchUser = async () => {
try {
if (typeof window === "undefined") return;


    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(
      `https://kbetz.onrender.com/api/me`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    const data = await res.json();

    if (!data || data.error) {
      localStorage.removeItem("token");
      return;
    }

    setUser(data);
  } catch (err) {
    console.log("User fetch error:", err);
  }
};

fetchUser();


}, []);

return user;
};
