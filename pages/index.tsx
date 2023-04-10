import Head from "next/head";
import styles from "@/styles/Home.module.css";
import React, { useEffect, useRef, useState } from "react";
import supabase from "@/lib/supabase";
import Loader from "../icons/loader.svg";
import Image from "next/image";
import useUser from "@/lib/useUser";
import { LogoutIcon } from "@/icons/logout";

export async function getServerSideProps() {
  const { data: messages } = await supabase.from("messages").select("*");

  return {
    props: {
      messages,
    },
  };
}

export default function Home({ messages: fetchedMessages }: { messages: any }) {
  const [messages, setMessages] = useState<any>(fetchedMessages);
  const [messageInput, setMessageInput] = useState<string>("");

  const { user } = useUser();

  if (user && user.identities) {
    var id = user.identities[0].id;
    var username = user.identities[0].identity_data?.full_name;
    var email = user.identities[0].identity_data?.email;
    var avatar = user.identities[0].identity_data?.avatar_url;
  }

  useEffect((): any => {
    if (!user) return;
    const scrollBox = document.getElementsByClassName(styles.description)[0];
    scrollBox.scrollTo(0, scrollBox.scrollHeight);

    const taskListener = supabase
      .channel("public:data")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new.user_id === id) return;
          setMessages((msgs: any) => [...msgs, payload.new]);
          scrollBox.scrollTo(0, scrollBox.scrollHeight);
        }
      )
      .subscribe();

    // add return right here!
    return () => taskListener.unsubscribe();
  }, [fetchedMessages, user]);

  function signout() {
    supabase.auth.signOut();
  }

  async function handleSubmit() {
    let placeholderID = `${username}_${messageInput
      .replace(/ /g, "-")
      .toLowerCase()}_${Math.floor(Math.random() * 1000)}`;

    setMessageInput("");
    setMessages((old: any) => [
      ...old,
      {
        id: placeholderID,
        user_id: id,
        name: username,
        message: messageInput,
        created_at: null,
      },
    ]);

    const sent: any = await supabase
      .from("messages")
      .insert({ user_id: id, name: username, message: messageInput })
      .select();

    if (sent.status === 201) {
      setMessages((old: any) =>
        old.map((message: any) => {
          if (message.id === placeholderID)
            return {
              ...message,
              id: sent.id,
              created_at: sent.created_at,
            };

          return message;
        })
      );
    }
  }

  //if (fetching) return <p>Loading...</p>;
  //if (error) return <p>Oh no... {error.message}</p>;

  return user && user.identities && user.identities[0].identity_data ? (
    <>
      <Head>
        <title>Chat App</title>
        <meta
          name="description"
          content="Chat App made by Alp Durak using Supabase and NextJS"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <div className={styles.authWrap}>
          <div className={styles.profile}>
            <p>{username}</p>
            <Image
              src={avatar.replace(/s[1-9][1-9]/, "s42")}
              alt={username}
              width={42}
              height={42}
            />
          </div>
          <button className={styles.signoutButton} onClick={() => signout()}>
            <LogoutIcon color="red" fontSize="30" />
          </button>
        </div>

        <div className={styles.description}>
          {messages.map((msg: any, key: any) => {
            if (user.identities && msg.user_id === id)
              return (
                <div key={key} data-owner="owner">
                  <p>{msg.message}</p>
                  {msg.created_at === null && (
                    <Image
                      src={Loader}
                      className={styles.messageLoader}
                      alt="message-loader"
                      width={15}
                      height={15}
                    />
                  )}
                </div>
              );
            return (
              <div key={key}>
                <p>
                  <code className={styles.code}>{msg.name}:</code> {msg.message}
                </p>
              </div>
            );
          })}
        </div>
        <div className={styles.interactiveUI}>
          <input
            name="MessageBox"
            type="text"
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key.toLowerCase() === "enter" && messageInput.length > 0)
                return handleSubmit();
            }}
            value={messageInput}
          />
          <button type="submit" onClick={handleSubmit}>
            Send
          </button>
        </div>
      </main>
    </>
  ) : (
    <center>
      <button
        onClick={() => {
          supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              queryParams: {
                access_type: "offline",
                prompt: "consent",
              },
            },
          });
        }}
      >
        Sign In
      </button>
    </center>
  );
}
