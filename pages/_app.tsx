import supabase from "@/lib/supabase";
import "@/styles/globals.css";
import { AppProps } from "next/app";
import { Provider } from "react-supabase";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider value={supabase}>
      <Component {...pageProps} />
    </Provider>
  );
}
