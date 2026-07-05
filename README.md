# Juliane 15 Anos | Uma Noite Estrelada

Aplicacao Next.js para convite digital, RSVP, area privada do convidado e painel administrativo.

## Execucao local

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:3000`.

Rotas principais:

- `/` experiencia publica cinematografica.
- `/convite` link unico para enviar a todos os convidados.
- `/c/AB12CD` convite individual demonstrativo.
- `/c/AB12CD/universo` area privada apos confirmacao.
- `/admin` painel administrativo.

## Variaveis de ambiente

Crie `.env.local` a partir de `.env.example`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Use `NEXT_PUBLIC_USE_FIREBASE=false` para rodar sem Firebase. Nesse modo, RSVP e painel usam `localStorage`.

Use `NEXT_PUBLIC_USE_FIREBASE=true` para enviar confirmações reais para o Firestore na coleção `rsvps`.

## Firebase

1. Crie um projeto no Firebase.
2. Ative Authentication com provedor e-mail/senha.
3. Crie manualmente o primeiro usuario administrador no Firebase Authentication.
4. Copie o `uid` desse usuario.
5. No Firestore, crie `admins/{uid}` com qualquer campo simples, por exemplo `{ "role": "owner" }`.
6. Crie o arquivo `.env.local`.
7. Publique regras e indices:

```bash
firebase login
firebase use PROJECT_ID
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

## Modelo de dados

Colecoes usadas:

- `events/{eventId}`
- `guests/{guestId}`
- `rsvps/{rsvpId}`
- `admins/{uid}`
- `content/{document}`
- `gallery/{photoId}`
- `giftCategories/{categoryId}`
- `gifts/{giftId}`

Campos principais de `guests`:

- `eventId`
- `mainGuestName`
- `phone`
- `inviteCode`
- `maxCompanions`
- `companionNames`
- `status`
- `active`
- `confirmedAt`
- `createdAt`
- `updatedAt`
- `notes`
- `origin`

Campos principais de `rsvps`:

- `eventId`
- `name`
- `phone`
- `willAttend`
- `people`
- `status`
- `totalPeople`
- `createdAt`

## Seguranca

As regras incluidas nao usam `allow read, write: if true`. Administradores sao validados por `admins/{uid}`.

O RSVP publico permite apenas `create` em `rsvps`; leitura, edicao e exclusao ficam restritas a administradores. Assim os convidados conseguem confirmar pelo link unico sem login, mas nao conseguem listar dados pessoais de outras pessoas.

Observacao importante: para painel administrativo sem e-mail/senha lendo dados do Firestore, use uma API Route/Cloud Function com Firebase Admin SDK e o `ADMIN_ACCESS_CODE` validado no servidor. Nao torne a coleção `rsvps` publicamente legivel.

## Qualidade

Comandos de verificacao:

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy

Para Next.js com Firebase, prefira Firebase App Hosting ou outro provedor compatível com Next.js. O arquivo `firebase.json` inclui regras e storage, mas o deploy da aplicacao Next pode exigir configuracao adicional conforme a opcao escolhida.
