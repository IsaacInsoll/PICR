export const getLatestBuild = async () => {
  const req = await fetch(
    'https://api.github.com/repos/isaacinsoll/picr/releases',
  );
  const json = (await req.json()) as { tag_name: string }[];
  if (Array.isArray(json)) {
    return json[0]?.tag_name ?? '';
  } else {
    return '';
  }
};
