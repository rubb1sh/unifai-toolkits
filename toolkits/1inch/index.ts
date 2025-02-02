import * as dotenv from 'dotenv';
dotenv.config();

import { ethers } from 'ethers';
import { Toolkit, ActionContext, TransactionAPI } from 'unifai-sdk';
import { getTokenBySymbol } from '../dexscreener/dexscreener';

async function getBaseTokenAddress(token: string) : Promise<string> {
  if (ethers.isAddress(token)) {
    return token;
  }
  const result = await getTokenBySymbol(token, 'base');
  return result?.base?.tokenAddress || token;
}

async function main() {
  const toolkit = new Toolkit({ apiKey: process.env.TOOLKIT_API_KEY });
  const api = new TransactionAPI({ apiKey: process.env.TOOLKIT_API_KEY });

  await toolkit.updateToolkit({
    name: '1inch',
    description: "1inch is a swap aggregator on any EVM compatible blockchain, e.g. Ethereum, Base, etc.",
  });

  toolkit.event('ready', () => {
    console.log('Toolkit is ready to use');
  });

  toolkit.action({
    action: 'swap',
    actionDescription: 'Swap tokens on any EVM compatible blockchain (e.g. Ethereum, Base, etc.) using 1inch',
    payloadDescription: {
      chain: {
        type: 'string',
        description: 'Chain name, e.g. ethereum, base, etc.',
        required: true,
      },
      inputToken: {
        type: 'string',
        description: 'Input token address or contract address or symbol or ticker',
        required: true,
      },
      outputToken: {
        type: 'string',
        description: 'Output token address or contract address or symbol or ticker',
        required: true,
      },
      amount: {
        type: 'number',
        description: 'Amount of input token to swap',
        required: true,
      },
      slippage: {
        type: 'number',
        description: 'Slippage percentage, default is 1 (which means 1%)',
        required: false,
      }
    }
  }, async (ctx: ActionContext, payload: any = {}) => {
    try {
      payload.inputToken = await getBaseTokenAddress(payload.inputToken);
      payload.outputToken = await getBaseTokenAddress(payload.outputToken);
      payload.amount = payload.amount.toString();
      const result = await api.createTransaction('1inch/swap', ctx, payload);
      return ctx.result(result);
    } catch (error) {
      return ctx.result({ error: `Failed to create transaction: ${error}` });
    }
  });

  await toolkit.run();
}

main().catch(console.error);
