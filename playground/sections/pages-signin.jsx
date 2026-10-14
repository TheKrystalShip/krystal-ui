import React from "react";
import { Button, CopyField, FormField, SignInScreen } from "@thekrystalship/krystal";
import tksMark from "../../packages/krystal/assets/tks-mark.png";
import { Section, Sub } from "../kit.jsx";

const box = (h) => ({ ["--k-cardscreen-height"]: "100%", height: h, overflow: "auto", border: "var(--edge)", borderRadius: "var(--r-md)" });

function Password() {
  const [last, setLast] = React.useState("none yet");
  return (
    <>
      <p style={{ margin: "0 0 8px", fontSize: 12, opacity: 0.6 }}>Submitted: {last}. The password "wrong" is refused; submit empty to see the field errors.</p>
      <div style={box(640)}>
        <SignInScreen mark={tksMark} wordmark="The Krystal Ship" tagline="Sign in."
          providers={["discord", "github", "google", "microsoft"]} onProvider={(p) => setLast("provider " + p)}
          password passwordAside={<Button variant="link" size="xs">Forgot?</Button>}
          onSubmit={async (v) => {
            await new Promise((r) => setTimeout(r, 500));
            if (v.password === "wrong") return { message: "That username and password do not match." };
            setLast(v.username);
          }}
          foot={<>Signing in to <b>Krystal Cinema</b></>} />
      </div>
    </>
  );
}

function Register() {
  const [tab, setTab] = React.useState("register");
  return (
    <div style={box(760)}>
      <SignInScreen mark={tksMark} wordmark="The Krystal Ship" tagline={tab === "register" ? "Create an account." : "Sign in."}
        tabs={[{ value: "login", label: "Sign in" }, { value: "register", label: "Register" }]} tab={tab} onTab={setTab}
        providers={["discord"]} password
        submitLabel={tab === "register" ? "Create account" : "Sign in"} busyLabel="Working…"
        passwordAutoComplete={tab === "register" ? "new-password" : "current-password"}
        defaultValues={{ displayName: "" }}
        extraFields={tab === "register" ? <FormField name="displayName" label="Display name" aside="optional" control="input" autoComplete="nickname" /> : null}
        onSubmit={async () => { await new Promise((r) => setTimeout(r, 500)); }} />
    </div>
  );
}

export default function PagesSignin() {
  return (
    <Section id="pages-signin" title="Page patterns: SignInScreen">
      <Sub title="Four providers, password form with Forgot, a refusal from onSubmit, foot"><Password /></Sub>
      <Sub title="One provider (brand), tabs, extra field"><Register /></Sub>
      <Sub title="Provider busy (leaving), service error, device code under the form">
        <div style={box(640)}>
          <SignInScreen mark={tksMark} wordmark="Krystal Cinema" providers={["discord", "github"]} busyProvider="github"
            error="The sign-in service is not answering. Try again in a moment." password>
            <CopyField value="ABCD-EFGH" />
          </SignInScreen>
        </div>
      </Sub>
      <Sub title="Providers only">
        <div style={box(360)}>
          <SignInScreen wordmark="Krystal Cinema" providers={["discord"]} />
        </div>
      </Sub>
    </Section>
  );
}
