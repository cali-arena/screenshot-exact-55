export const pageHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} · Carbono Guard AI` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · Carbono Guard AI` },
    { property: "og:description", content: description },
  ],
});
