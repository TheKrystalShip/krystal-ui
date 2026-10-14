import { Stack, Cluster, Grid, Container } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

const Box = ({ children }) => (
  <div style={{ background: "var(--surface-2)", border: "var(--edge)", borderRadius: "var(--r-sm)", padding: "8px 12px", fontSize: 12 }}>{children}</div>
);
const boxes = (n) => Array.from({ length: n }, (_, i) => <Box key={i}>{i + 1}</Box>);

export default function Layout() {
  return (
    <Section id="layout" title="Layout: Stack, Cluster, Grid, Container">
      <Sub title="Stack: gap xs, md, xl and step 10; align center">
        <Cluster gap="lg" align="start">
          <Stack gap="xs">{boxes(3)}</Stack>
          <Stack gap="md">{boxes(3)}</Stack>
          <Stack gap="xl">{boxes(3)}</Stack>
          <Stack gap={10}>{boxes(3)}</Stack>
          <Stack gap="sm" align="center" style={{ width: 120 }}>{boxes(3)}</Stack>
        </Cluster>
      </Sub>
      <Sub title="Cluster: wrapping, justify start / center / end / between, align">
        <Stack gap="sm">
          <Cluster gap="sm">{boxes(14)}</Cluster>
          <Cluster gap="sm" justify="center">{boxes(3)}</Cluster>
          <Cluster gap="sm" justify="end">{boxes(3)}</Cluster>
          <Cluster gap="sm" justify="between">{boxes(3)}</Cluster>
          <Cluster gap="sm" align="stretch" nowrap style={{ minHeight: 56 }}>{boxes(3)}</Cluster>
        </Stack>
      </Sub>
      <Sub title="Grid: min 160 (fits the width), fill, cols 3, as ul">
        <Stack gap="md">
          <Grid min={160} gap="sm">{boxes(7)}</Grid>
          <Grid min={160} gap="sm" fill>{boxes(2)}</Grid>
          <Grid cols={3} gap={2}>{boxes(6)}</Grid>
          <Grid as="ul" min="12rem" gap={3} style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {boxes(4).map((b, i) => <li key={i}>{b}</li>)}
          </Grid>
        </Stack>
      </Sub>
      <Sub title="Container: sm, md, lg, xl, full, flush">
        <Stack gap="sm">
          {["sm", "md", "lg", "xl", "full"].map((size) => (
            <div key={size} style={{ outline: "1px dashed var(--border-strong)" }}>
              <Container size={size} style={{ paddingBlock: 8 }}><Box>{size}</Box></Container>
            </div>
          ))}
          <div style={{ outline: "1px dashed var(--border-strong)" }}>
            <Container size="md" flush><Box>md, flush</Box></Container>
          </div>
        </Stack>
      </Sub>
    </Section>
  );
}
