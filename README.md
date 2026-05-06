# new-vibe-01

Cloudflare Pages Functions와 D1을 사용하는 간단한 메모장입니다.

## Cloudflare 설정

1. Cloudflare D1 데이터베이스를 만듭니다.

```bash
npx wrangler d1 create new-vibe-01-notes
```

2. Cloudflare Pages 프로젝트에 D1 바인딩을 추가합니다.

- Binding name: `DB`
- Database: `new-vibe-01-notes`

Dashboard에서는 `Workers & Pages > Pages 프로젝트 > Settings > Bindings`에서 추가할 수 있습니다.

3. D1 마이그레이션을 적용합니다.

```bash
npx wrangler d1 migrations apply new-vibe-01-notes --remote
```

4. Pages에 배포합니다.

GitHub 저장소를 Cloudflare Pages에 연결했다면, push 후 자동 배포됩니다.

로컬에서 확인하려면:

```bash
npm install
npm run dev
```

## API

- `GET /notes`
- `POST /notes`
- `PUT /notes/:id`
- `DELETE /notes/:id`

Cloudflare API 키는 HTML이나 GitHub 저장소에 넣지 않습니다. D1 바인딩은 Cloudflare 대시보드나 Wrangler 설정으로 연결합니다.
