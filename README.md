prisma-merge-schema
===================

Merges/postfixes Prisma v2 schemas.

See usage section and examples for more details.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/prisma-merge-schema.svg)](https://npmjs.org/package/prisma-merge-schema)
[![Downloads/week](https://img.shields.io/npm/dw/prisma-merge-schema.svg)](https://npmjs.org/package/prisma-merge-schema)
[![License](https://img.shields.io/npm/l/prisma-merge-schema.svg)](https://github.com/smcelhinney/prisma-merge-schema/blob/main/package.json)


## Examples

### Merge schemas (glob pattern)

```shell
npx prisma-merge-schema \
  --datasource ./prisma/src/**/* 
  --outputFile output.schema
```

### Merge schemas (multiple files explicitly declared)

```shell
npx prisma-merge-schema \
  --datasource ./prisma/src/datasource1.prisma  \
  --datasource ./prisma/src/datasource2.prisma  \
  --outputFile output.schema
```

### Merge schemas and apply decorators

```shell
npx prisma-merge-schema \
  --datasource ./prisma/src/datasource.prisma \
  --decorators ./prisma/src/decorators.prisma \
  --outputFile output.schema
```

## Decorators

Given a datasource of 

```prisma
model User {
  id          Int       @id
  username    String    @default("") @db.VarChar(1000)
  extrafield  String    @default("") @db.VarChar(1000)
}
```

and a decorator file of 

```prisma
extends model User {
  newfield    String    @default("") @db.VarChar(1000)
}

replaces model User {
  id          Int       @id @db.UnsignedInt
}

remove model User {
  extrafield
}
```

running

```shell
npx prisma-merge-schema \
  --datasource ./prisma/src/datasource.prisma \
  --decorators ./prisma/src/decorators.prisma \
  --outputFile ./prisma/schema.prisma
```

produces a schema file

```prisma
model User {
  id          Int       @id @db.UnsignedInt
  username    String    @default("") @db.VarChar(1000)
  newfield    String    @default("") @db.VarChar(1000)
}
```

Useful for applying changes after `prisma introspect` without modifying your original schema. 

## Feature roadmap

* Allow merging of multiple datasource schemas (`glob`) 
* Handle automatic deletion of `@@index` annotations


# Usage
<!-- usage -->
```sh-session
$ npm install -g prisma-merge-schema
$ prisma-merge-schema COMMAND
running command...
$ prisma-merge-schema (-v|--version|version)
prisma-merge-schema/1.0.0 darwin-x64 node-v12.18.2
$ prisma-merge-schema --help [COMMAND]
USAGE
  $ prisma-merge-schema COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->

<!-- commandsstop -->
