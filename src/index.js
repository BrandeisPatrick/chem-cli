#!/usr/bin/env node

import { ChemCLI } from './cli/index.js';

const cli = new ChemCLI();
await cli.start();