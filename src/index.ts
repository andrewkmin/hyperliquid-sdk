import type { TurnkeySigner } from "@turnkey/ethers";

import { InfoAPI } from "./rest/info";
import { ExchangeAPI } from "./rest/exchange";
import { WebSocketClient } from "./websocket/connection";
import { WebSocketSubscriptions } from "./websocket/subscriptions";
import { RateLimiter } from "./utils/rateLimiter";
import * as CONSTANTS from "./types/constants";
import { CustomOperations } from "./rest/custom";
import { SymbolConversion } from "./utils/symbolConversion";
import { AuthenticationError } from "./utils/errors";

export class Hyperliquid {
  public info: InfoAPI;
  public exchange: ExchangeAPI;
  public ws: WebSocketClient;
  public subscriptions: WebSocketSubscriptions;
  public custom: CustomOperations;

  private rateLimiter: RateLimiter;
  private symbolConversion: SymbolConversion;
  private walletAddress: string | null = null;
  private turnkeySigner: TurnkeySigner | null = null;

  constructor(
    testnet: boolean = false,
    turnkeySigner: TurnkeySigner,
    walletAddress: string | null = null,
  ) {
    const baseURL = testnet
      ? CONSTANTS.BASE_URLS.TESTNET
      : CONSTANTS.BASE_URLS.PRODUCTION;

    this.rateLimiter = new RateLimiter();
    this.symbolConversion = new SymbolConversion(baseURL, this.rateLimiter);

    this.info = new InfoAPI(baseURL, this.rateLimiter, this.symbolConversion);
    this.ws = new WebSocketClient(testnet);
    this.subscriptions = new WebSocketSubscriptions(
      this.ws,
      this.symbolConversion,
    );

    // Create proxy objects for exchange and custom
    this.exchange = this.createAuthenticatedProxy(ExchangeAPI);
    this.custom = this.createAuthenticatedProxy(CustomOperations);

    this.turnkeySigner = turnkeySigner;
    this.walletAddress = walletAddress;

    if (turnkeySigner) {
      this.initializeWithTurnkeySigner(turnkeySigner, testnet);
    }
  }

  private createAuthenticatedProxy<T extends object>(
    Class: new (...args: any[]) => T,
  ): T {
    return new Proxy({} as T, {
      get: (target, prop) => {
        if (!this.turnkeySigner) {
          throw new AuthenticationError(
            "Invalid or missing Signer. This method requires authentication.",
          );
        }
        return target[prop as keyof T];
      },
    });
  }

  private initializeWithTurnkeySigner(
    turnkeySigner: TurnkeySigner,
    testnet: boolean = false,
  ): void {
    try {
      this.exchange = new ExchangeAPI(
        testnet,
        this.turnkeySigner!,
        this.info,
        this.rateLimiter,
        this.symbolConversion,
        this.walletAddress,
      );
      this.custom = new CustomOperations(
        this.exchange,
        this.info,
        this.symbolConversion,
        this.turnkeySigner!,
        this.walletAddress,
      );
    } catch (error) {
      console.warn(
        "Invalid Turnkey Signer provided. Some functionalities will be limited.",
      );
    }
  }

  public isAuthenticated(): boolean {
    return !!this.turnkeySigner;
  }

  async connect(): Promise<void> {
    await this.ws.connect();
    if (!this.turnkeySigner) {
      console.warn(
        "Not authenticated. Some WebSocket functionalities may be limited.",
      );
    }
  }

  disconnect(): void {
    this.ws.close();
  }
}

export * from "./types";
export * from "./utils/signing";
