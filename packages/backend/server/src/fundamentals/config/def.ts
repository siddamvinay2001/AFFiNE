import type { ApolloDriverConfig } from '@nestjs/apollo';

import type { LeafPaths } from '../utils/types';
import { EnvConfigType } from './env';
import type { AFFiNEStorageConfig } from './storage';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace globalThis {
    // eslint-disable-next-line no-var
    var AFFiNE: AFFiNEConfig;
  }
}

export enum ExternalAccount {
  github = 'github',
  google = 'google',
  firebase = 'firebase',
}

export type ServerFlavor = 'allinone' | 'graphql' | 'sync';
export type AFFINE_ENV = 'dev' | 'beta' | 'production';
export type NODE_ENV = 'development' | 'test' | 'production';

export enum DeploymentType {
  Affine = 'affine',
  Selfhosted = 'selfhosted',
}

export type ConfigPaths = LeafPaths<
  Omit<
    AFFiNEConfig,
    | 'ENV_MAP'
    | 'version'
    | 'type'
    | 'isSelfhosted'
    | 'flavor'
    | 'env'
    | 'affine'
    | 'deploy'
    | 'node'
    | 'baseUrl'
    | 'origin'
  >,
  '',
  '.....'
>;

/**
 * All Configurations that would control AFFiNE server behaviors
 *
 */
export interface AFFiNEConfig {
  ENV_MAP: Record<string, ConfigPaths | [ConfigPaths, EnvConfigType?]>;
  /**
   * Server Identity
   */
  serverId: string;

  /**
   * Name may show on the UI
   */
  serverName: string;

  /**
   * System version
   */
  readonly version: string;

  /**
   * Deployment type, AFFiNE Cloud, or Selfhosted
   */
  get type(): DeploymentType;

  /**
   * Fast detect whether currently deployed in a selfhosted environment
   */
  get isSelfhosted(): boolean;

  /**
   * Server flavor
   */
  get flavor(): {
    type: string;
    graphql: boolean;
    sync: boolean;
  };

  /**
   * Deployment environment
   */
  readonly AFFINE_ENV: AFFINE_ENV;
  /**
   * alias to `process.env.NODE_ENV`
   *
   * @default 'development'
   * @env NODE_ENV
   */
  readonly NODE_ENV: NODE_ENV;

  /**
   * fast AFFiNE environment judge
   */
  get affine(): {
    canary: boolean;
    beta: boolean;
    stable: boolean;
  };
  /**
   * fast environment judge
   */
  get node(): {
    prod: boolean;
    dev: boolean;
    test: boolean;
  };

  get deploy(): boolean;

  /**
   * Whether the server is hosted on a ssl enabled domain
   */
  https: boolean;
  /**
   * where the server get deployed.
   *
   * @default 'localhost'
   * @env AFFINE_SERVER_HOST
   */
  host: string;
  /**
   * which port the server will listen on
   *
   * @default 3010
   * @env AFFINE_SERVER_PORT
   */
  port: number;
  /**
   * subpath where the server get deployed if there is.
   *
   * @default '' // empty string
   * @env AFFINE_SERVER_SUB_PATH
   */
  path: string;

  /**
   * Readonly property `baseUrl` is the full url of the server consists of `https://HOST:PORT/PATH`.
   *
   * if `host` is not `localhost` then the port will be ignored
   */
  get baseUrl(): string;

  /**
   * Readonly property `origin` is domain origin in the form of `https://HOST:PORT` without subpath.
   *
   * if `host` is not `localhost` then the port will be ignored
   */
  get origin(): string;

  /**
   * the database config
   */
  db: {
    url: string;
  };

  /**
   * the apollo driver config
   */
  graphql: ApolloDriverConfig;
  /**
   * app features flag
   */
  featureFlags: {
    earlyAccessPreview: boolean;
  };

  /**
   * Configuration for Object Storage, which defines how blobs and avatar assets are stored.
   */
  storage: AFFiNEStorageConfig;

  /**
   * Rate limiter config
   */
  rateLimiter: {
    /**
     * How long each request will be throttled (seconds)
     * @default 60
     * @env THROTTLE_TTL
     */
    ttl: number;
    /**
     * How many requests can be made in the given time frame
     * @default 120
     * @env THROTTLE_LIMIT
     */
    limit: number;
  };

  /**
   * authentication config
   */
  auth: {
    /**
     * Application access token expiration time
     */
    readonly accessTokenExpiresIn: number;
    /**
     * Application refresh token expiration time
     */
    readonly refreshTokenExpiresIn: number;
    /**
     * Add some leeway (in seconds) to the exp and nbf validation to account for clock skew.
     * Defaults to 60 if omitted.
     */
    readonly leeway: number;
    /**
     * Application public key
     *
     */
    readonly publicKey: string;
    /**
     * Application private key
     *
     */
    readonly privateKey: string;
    /**
     * whether allow user to signup with email directly
     */
    enableSignup: boolean;
    /**
     * whether allow user to signup by oauth providers
     */
    enableOauth: boolean;
    /**
     * NEXTAUTH_SECRET
     */
    nextAuthSecret: string;
    /**
     * all available oauth providers
     */
    oauthProviders: Partial<
      Record<
        ExternalAccount,
        {
          enabled: boolean;
          clientId: string;
          clientSecret: string;
          /**
           * uri to start oauth flow
           */
          authorizationUri?: string;
          /**
           * uri to authenticate `access_token` when user is redirected back from oauth provider with `code`
           */
          accessTokenUri?: string;
          /**
           * uri to get user info with authenticated `access_token`
           */
          userInfoUri?: string;
          args?: Record<string, any>;
        }
      >
    >;
    /**
     * whether to use local email service to send email
     * local debug only
     */
    localEmail: boolean;
    email: {
      server: string;
      port: number;
      login: string;
      sender: string;
      password: string;
    };
    captcha: {
      /**
       * whether to enable captcha
       */
      enable: boolean;
      turnstile: {
        /**
         * Cloudflare Turnstile CAPTCHA secret
         * default value is demo api key, witch always return success
         */
        secret: string;
      };
      challenge: {
        /**
         * challenge bits length
         * default value is 20, which can resolve in 0.5-3 second in M2 MacBook Air in single thread
         * @default 20
         */
        bits: number;
      };
    };
  };

  doc: {
    manager: {
      /**
       * Whether auto merge updates into doc snapshot.
       */
      enableUpdateAutoMerging: boolean;

      /**
       * How often the [DocManager] will start a new turn of merging pending updates into doc snapshot.
       *
       * This is not the latency a new joint client will take to see the latest doc,
       * but the buffer time we introduced to reduce the load of our service.
       *
       * in {ms}
       */
      updatePollInterval: number;

      /**
       * The maximum number of updates that will be pulled from the server at once.
       * Existing for avoiding the server to be overloaded when there are too many updates for one doc.
       */
      maxUpdatesPullCount: number;

      /**
       * Use `y-octo` to merge updates at the same time when merging using Yjs.
       *
       * This is an experimental feature, and aimed to check the correctness of JwstCodec.
       */
      experimentalMergeWithYOcto: boolean;
    };
    history: {
      /**
       * How long the buffer time of creating a new history snapshot when doc get updated.
       *
       * in {ms}
       */
      interval: number;
    };
  };

  metrics: {
    enabled: boolean;
  };
}

export * from './storage';
