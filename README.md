prisma-merge-schema
===================

Merges/postfixes Prisma v2 schemas. 

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/prisma-merge-schema.svg)](https://npmjs.org/package/prisma-merge-schema)
[![Downloads/week](https://img.shields.io/npm/dw/prisma-merge-schema.svg)](https://npmjs.org/package/prisma-merge-schema)
[![License](https://img.shields.io/npm/l/prisma-merge-schema.svg)](https://github.com/smcelhinney/prisma-merge-schema/blob/main/package.json)

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

produces 

```prisma
model User {
  id          Int       @id @db.UnsignedInt
  username    String    @default("") @db.VarChar(1000)
  newfield    String    @default("") @db.VarChar(1000)
}
```

## Feature roadmap

* Allow merging of multiple datasource schemas 
* Handle automatic deletion of `@@index` annotations


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g prisma-merge-schema
$ prisma-merge-schema \
  --datasource ./prisma/src/datasource.prisma \
  --decorator ./prisma/src/decorators.prisma \
  --outputFile ./prisma/schema.prisma
running command...

$ prisma-merge-schema (-v|--version|version)
prisma-merge-schema/0.0.2 darwin-x64 node-v12.18.2

$ prisma-merge-schema --help [COMMAND]
USAGE
  $ prisma-merge-schema COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->

<!-- commandsstop -->
