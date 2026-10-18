import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Hero, HeroBody, HeroName } from "@thekrystalship/krystal";

describe("the cinematic hero", () => {
  it("draws its art behind a scrim", () => {
    const { container } = render(<Hero art='url("a.jpg")'><HeroBody><HeroName>Stamppot</HeroName></HeroBody></Hero>);
    expect(container.querySelector(".k-hero__scrim")).not.toBeNull();
    expect(container.querySelector(".k-hero--bare")).toBeNull();
  });

  it("with no art draws no scrim and marks itself bare", () => {
    const { container } = render(<Hero><HeroBody><HeroName>Stamppot</HeroName></HeroBody></Hero>);
    expect(container.querySelector(".k-hero__scrim")).toBeNull();
    expect(container.querySelector(".k-hero__art")).toBeNull();
    expect(container.querySelector(".k-hero--bare")).not.toBeNull();
  });
});
