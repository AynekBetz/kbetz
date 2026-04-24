export const metadata = {
title: "KBETZ",
description: "Elite Betting Terminal",
};

export default function RootLayout({ children }) {
return ( <html lang="en">
<body
style={{
margin: 0,
padding: 0,
background: "#050505",
color: "white",
fontFamily: "Inter, sans-serif",
}}
>
{children} </body> </html>
);
}
