import { cacheExchange } from '@urql/exchange-graphcache';
import type {
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  SelectionSetNode,
} from 'graphql';
import { Kind, parse, print } from 'graphql';
import { createClient, fetchExchange } from 'urql';
import { describe, expect, test, vi } from 'vitest';
import { dashboardCommentsQuery } from '@shared/urql/queries/dashboardCommentsQuery';
import { viewFileQuery } from '@shared/urql/queries/viewFileQuery';
import { urqlCacheConfig } from './urqlCacheExchange';

// The behavioural tests below use small hand-written documents so the entity
// identity rules stay readable. The document contract test at the bottom uses
// the real production documents instead, because the thing that silently breaks
// the modal's cache hit is a field added to viewFileQuery alone - which a
// hand-written fixture can never notice.
const commentFileQuery = parse(/* GraphQL */ `
  query CommentFileForCacheTest {
    comments(folderId: "1", includeChildren: true) {
      id
      file {
        __typename
        id
        name
        type
        ... on Image {
          imageRatio
          metadata {
            Camera
          }
        }
        ... on Video {
          duration
          metadata {
            Format
          }
        }
      }
    }
  }
`);

const modalFileQuery = parse(/* GraphQL */ `
  query ModalFileForCacheTest($fileId: ID!) {
    file(id: $fileId) {
      __typename
      id
      name
      type
      ... on Image {
        imageRatio
        metadata {
          Camera
        }
      }
      ... on Video {
        duration
        metadata {
          Format
        }
      }
    }
  }
`);

interface MockFile {
  __typename: 'Image' | 'Video';
  id: string;
  name: string;
  type: 'Image' | 'Video';
  imageRatio?: number;
  duration?: number;
  metadata: {
    __typename: 'ImageMetadataSummary' | 'VideoMetadataSummary';
    Camera?: string;
    Format?: string;
  };
}

const createCacheClient = (files: MockFile[]) => {
  let responseIndex = 0;
  const mockFetch = vi.fn<typeof fetch>(async () => {
    const file = files.at(responseIndex++);
    if (!file) throw new Error('Unexpected network request');

    return new Response(
      JSON.stringify({
        data: {
          comments: [
            {
              __typename: 'Comment',
              id: 'comment-1',
              file,
            },
          ],
        },
      }),
      { headers: { 'content-type': 'application/json' } },
    );
  });
  const client = createClient({
    url: 'https://picr.invalid/graphql',
    exchanges: [cacheExchange(urqlCacheConfig), fetchExchange],
    fetch: mockFetch,
  });

  return { client, mockFetch };
};

const image: MockFile = {
  __typename: 'Image',
  id: '42',
  name: 'photo.jpg',
  type: 'Image',
  imageRatio: 1.5,
  metadata: { __typename: 'ImageMetadataSummary', Camera: 'PICR 1' },
};

const video: MockFile = {
  __typename: 'Video',
  id: '42',
  name: 'media.mp4',
  type: 'Video',
  duration: 12,
  metadata: { __typename: 'VideoMetadataSummary', Format: 'mp4' },
};

describe('file modal Graphcache resolution', () => {
  test('reuses a complete image normalized by the dashboard comment query', async () => {
    const { client, mockFetch } = createCacheClient([image]);
    await client
      .query(commentFileQuery, {}, { requestPolicy: 'network-only' })
      .toPromise();

    const result = await client
      .query(modalFileQuery, { fileId: '42' }, { requestPolicy: 'cache-only' })
      .toPromise();

    expect(result.data?.file).toEqual({
      __typename: 'Image',
      id: '42',
      name: 'photo.jpg',
      type: 'Image',
      imageRatio: 1.5,
      metadata: { Camera: 'PICR 1' },
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('replaces the concrete view when the same file ID changes type', async () => {
    const { client, mockFetch } = createCacheClient([image, video]);
    await client
      .query(commentFileQuery, {}, { requestPolicy: 'network-only' })
      .toPromise();
    await client
      .query(commentFileQuery, {}, { requestPolicy: 'network-only' })
      .toPromise();

    const result = await client
      .query(modalFileQuery, { fileId: '42' }, { requestPolicy: 'cache-only' })
      .toPromise();

    expect(result.data?.file).toEqual({
      __typename: 'Video',
      id: '42',
      name: 'media.mp4',
      type: 'Video',
      duration: 12,
      metadata: { Format: 'mp4' },
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

const fragmentsOf = (doc: DocumentNode) =>
  new Map(
    doc.definitions
      .filter(
        (d): d is FragmentDefinitionNode => d.kind === Kind.FRAGMENT_DEFINITION,
      )
      .map((d) => [d.name.value, d] as const),
  );

const fileConcreteTypes = ['File', 'Image', 'Video'] as const;
type FileConcreteType = (typeof fileConcreteTypes)[number];

const narrowFileTypes = (
  current: ReadonlySet<FileConcreteType>,
  condition?: string,
) => {
  if (!condition || condition === 'FileInterface') return current;
  if (!fileConcreteTypes.includes(condition as FileConcreteType)) {
    throw new Error(`Unsupported top-level file fragment type ${condition}`);
  }
  const concrete = condition as FileConcreteType;
  return current.has(concrete)
    ? new Set<FileConcreteType>([concrete])
    : new Set<FileConcreteType>();
};

const fieldCacheKey = (field: FieldNode) => {
  const args = [...(field.arguments ?? [])]
    .sort((a, b) => a.name.value.localeCompare(b.name.value))
    .map((arg) => `${arg.name.value}:${print(arg.value)}`)
    .join(',');
  return args ? `${field.name.value}(${args})` : field.name.value;
};

// Graphcache fields are keyed by their schema field name and arguments. Track
// the concrete FileInterface implementation each selection applies to as well:
// an Image-only field does not satisfy the same path selected only for Video.
const collectFieldPaths = (doc: DocumentNode, root: SelectionSetNode) => {
  const fragments = fragmentsOf(doc);
  const paths = new Set<string>();
  const walk = (
    set: SelectionSetNode,
    prefix: string,
    applicableTypes: ReadonlySet<FileConcreteType>,
  ) => {
    for (const selection of set.selections) {
      if (selection.kind === Kind.FIELD) {
        const field = fieldCacheKey(selection);
        const path = `${prefix}${field}`;
        for (const type of applicableTypes) paths.add(`${type}:${path}`);
        if (selection.selectionSet) {
          walk(selection.selectionSet, `${path}.`, applicableTypes);
        }
      } else if (selection.kind === Kind.INLINE_FRAGMENT) {
        walk(
          selection.selectionSet,
          prefix,
          prefix === ''
            ? narrowFileTypes(
                applicableTypes,
                selection.typeCondition?.name.value,
              )
            : applicableTypes,
        );
      } else {
        const fragment = fragments.get(selection.name.value);
        if (!fragment) {
          throw new Error(`Unresolved fragment ${selection.name.value}`);
        }
        walk(
          fragment.selectionSet,
          prefix,
          prefix === ''
            ? narrowFileTypes(
                applicableTypes,
                fragment.typeCondition.name.value,
              )
            : applicableTypes,
        );
      }
    }
  };
  walk(root, '', new Set(fileConcreteTypes));
  return paths;
};

// Descends named fields, seeing through fragment spreads on the way.
const selectionSetAt = (doc: DocumentNode, path: string[]) => {
  const fragments = fragmentsOf(doc);
  const findField = (
    set: SelectionSetNode,
    name: string,
  ): SelectionSetNode | undefined => {
    for (const selection of set.selections) {
      if (selection.kind === Kind.FIELD) {
        if (selection.name.value === name) return selection.selectionSet;
      } else {
        const inner =
          selection.kind === Kind.INLINE_FRAGMENT
            ? selection.selectionSet
            : fragments.get(selection.name.value)?.selectionSet;
        const found = inner && findField(inner, name);
        if (found) return found;
      }
    }
    return undefined;
  };

  const operation = doc.definitions.find(
    (d) => d.kind === Kind.OPERATION_DEFINITION,
  );
  if (operation?.kind !== Kind.OPERATION_DEFINITION) {
    throw new Error('Document has no operation');
  }

  let set: SelectionSetNode = operation.selectionSet;
  for (const name of path) {
    const next = findField(set, name);
    if (!next) throw new Error(`No selection set at ${path.join('.')}`);
    set = next;
  }
  return set;
};

describe('file modal document contract', () => {
  // The dashboard renders comments, then the modal host queries the file by ID
  // and expects a cache hit. That only holds while everything viewFileQuery
  // selects was already written by the comment query. Adding a field to
  // viewFileQuery without adding it to FileFragment reintroduces the network
  // round-trip and loading flash, silently.
  test('viewFileQuery selects nothing the dashboard comment query has not cached', () => {
    const modalFields = collectFieldPaths(
      viewFileQuery as DocumentNode,
      selectionSetAt(viewFileQuery as DocumentNode, ['file']),
    );
    const cachedFields = collectFieldPaths(
      dashboardCommentsQuery as DocumentNode,
      selectionSetAt(dashboardCommentsQuery as DocumentNode, [
        'comments',
        'file',
      ]),
    );

    expect(modalFields.size).toBeGreaterThan(10);
    expect([...modalFields].filter((f) => !cachedFields.has(f))).toEqual([]);
  });

  test('distinguishes fields by concrete type and field arguments', () => {
    const imageDocument = parse(/* GraphQL */ `
      query ImageDocument {
        file(id: "1") {
          ... on Image {
            preview(size: 1)
          }
        }
      }
    `);
    const imageWithDifferentArgumentDocument = parse(/* GraphQL */ `
      query ImageWithDifferentArgumentDocument {
        file(id: "1") {
          ... on Image {
            preview(size: 2)
          }
        }
      }
    `);
    const videoDocument = parse(/* GraphQL */ `
      query VideoDocument {
        file(id: "1") {
          ... on Video {
            preview(size: 1)
          }
        }
      }
    `);

    const imageFields = collectFieldPaths(
      imageDocument,
      selectionSetAt(imageDocument, ['file']),
    );
    const imageWithDifferentArgumentFields = collectFieldPaths(
      imageWithDifferentArgumentDocument,
      selectionSetAt(imageWithDifferentArgumentDocument, ['file']),
    );
    const videoFields = collectFieldPaths(
      videoDocument,
      selectionSetAt(videoDocument, ['file']),
    );

    expect(
      [...imageFields].filter((field) =>
        imageWithDifferentArgumentFields.has(field),
      ),
    ).toEqual([]);
    expect([...imageFields].filter((field) => videoFields.has(field))).toEqual(
      [],
    );
  });

  test('does not let nested media fragments narrow the owning file type', () => {
    const cachedFields = collectFieldPaths(
      dashboardCommentsQuery as DocumentNode,
      selectionSetAt(dashboardCommentsQuery as DocumentNode, [
        'comments',
        'file',
      ]),
    );

    for (const type of fileConcreteTypes) {
      expect(cachedFields).toContain(`${type}:folder.heroImage.imageRatio`);
    }
  });
});
