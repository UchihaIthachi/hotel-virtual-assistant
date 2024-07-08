// pages/_app.js
import "../styles/globals.css";
import { ChatProvider } from "../hooks/useChat";

function MyApp({ Component, pageProps }) {
  return (
    <ChatProvider>
      <Component {...pageProps} />
    </ChatProvider>
  );
}

export default MyApp;
