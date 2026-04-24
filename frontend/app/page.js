"use client";

import { useEffect } from "react";

export default function Home() {
useEffect(() => {
const token = localStorage.getItem("token");

```
if (token) {
  window.location.href = "/dashboard";
} else {
  window.location.href = "/login";
}
```

}, []);

return (
<div style={{
height: "100vh",
background: "#050505",
color: "white",
display: "flex",
justifyContent: "center",
alignItems: "center"
}}>
Loading... </div>
);
}
