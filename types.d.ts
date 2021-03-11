/*!
 * NeepRouter v0.1.0-alpha.6
 * (c) 2020-2021 Fierflame
 * @license MIT
 */
import Neep from '@neep/core';
import { Match as Match$1 } from 'path-to-regexp';
import { Value } from 'monitorable';

declare function installNeep(Neep: typeof Neep): void;

declare class StoreHistory implements IHistory {
    router: Router;
    constructor(router: Router);
    index: number;
    history: [string, string, string, any][];
    push(path: string, search: string, hash: string, state: any): void;
    replace(path: string, search: string, hash: string, state: any): void;
    go(index: number): [string, string, string, any] | undefined;
    back(): [string, string, string, any] | undefined;
    forward(): [string, string, string, any] | undefined;
    link(props: IHistoryLinkProps, { childNodes, emit }: Neep.ShellContext<any>, onClick: () => void): Neep.Element<Neep.Tag<any>>;
}

declare class WebPathHistory implements IHistory {
    readonly router: Router;
    readonly base: string;
    constructor(router: Router, opt?: {
        base?: string;
    });
    start(): void;
    destroy(): void;
    push(path: string, search: string, hash: string, state: any): void;
    replace(path: string, search: string, hash: string, state: any): void;
    private getPath;
    go(index: number): [string, string, string, any] | undefined;
    back(): [string, string, string, any] | undefined;
    forward(): [string, string, string, any] | undefined;
    link({ to, ...props }: IHistoryLinkProps, { childNodes, emit }: Neep.ShellContext<any>, onClick: () => void): Neep.Element<Neep.Tag<any>>;
}

declare class WebPathHistory$1 implements IHistory {
    router: Router;
    constructor(router: Router);
    start(): void;
    destroy(): void;
    push(path: string, search: string, hash: string): void;
    replace(path: string, search: string, hash: string): void;
    go(index: number): [string, string, string, any] | undefined;
    back(): [string, string, string, any] | undefined;
    forward(): [string, string, string, any] | undefined;
    link({ to, ...props }: IHistoryLinkProps, { childNodes, emit }: Neep.ShellContext<any>, onClick: () => void): Neep.Element<Neep.Tag<any>>;
}



declare namespace history {
  export {
    StoreHistory as Memory,
    WebPathHistory as WebPath,
    WebPathHistory$1 as WebHash,
  };
}

declare class Router {
    static get history(): typeof history;
    static get install(): typeof installNeep;
    static get View(): Neep.ShellComponent<ViewProps, any>;
    static get Link(): Neep.ShellComponent<LinkProps, any>;
    stringify?(query: Record<any, any>): string;
    parse?(search: string): Record<any, any>;
    private _namedRoutes;
    private _routes;
    history?: IHistory;
    private readonly _size;
    private readonly _nodes;
    private readonly _matches;
    private readonly _hash;
    private readonly _search;
    private readonly _alias;
    private readonly _path;
    private readonly _state;
    private readonly _params;
    private readonly _query;
    private readonly _meta;
    get size(): number;
    get matches(): Match[];
    get alias(): string;
    get path(): string;
    get search(): string;
    get hash(): string;
    get state(): any;
    get params(): Record<string, string>;
    get query(): Record<string, any>;
    get meta(): Record<string, any>;
    constructor({ History, historyOption }: {
        History?: {
            new (router: Router, opt?: any): IHistory;
        };
        historyOption?: any;
    });
    setRoutes(routes: RouteConfig[]): void;
    _get(index: number): Match | undefined;
    _update(path: string, search: string, hash: string, state?: any, force?: boolean): void;
    push(location: Location | string, state?: any): void;
    replace(location: Location | string, state?: any): void;
    getUrl(location: Location | string): string;
    go(index: number): void;
    back(): void;
    forward(): void;
    get view(): Neep.ShellComponent<object, Record<string, any>>;
}

interface ViewProps {
    name?: string;
    depth?: number;
    router?: Router;
}
interface LinkProps extends Location {
    to?: Location | string;
    replace?: boolean;
    [name: string]: any;
}
interface IHistoryLinkProps extends LinkProps {
    to: Location;
}
interface RouteConfig {
    path?: string;
    children?: this[];
    meta?: object;
    redirect?: string;
    append?: boolean;
    component?: Neep.Component;
    alias?: any;
    components?: Record<string, Neep.Component>;
}
interface Route extends RouteConfig {
    path: string;
    meta: object;
    toPath(object: object): string;
    match(path: string): Match$1<any>;
}
interface RouteContext {
    readonly size: number;
    readonly matches: Match[];
    readonly match?: Match;
    readonly alias: string;
    readonly path: string;
    readonly search: string;
    readonly hash: string;
    readonly state: string;
    readonly params: Record<string, string>;
    readonly query: Record<string, any>;
    readonly meta: Record<string, any>;
    readonly router: Router;
    push(location: Location | string, state?: any): void;
    replace(location: Location | string, state?: any): void;
    getUrl(location: Location | string): string;
    go(index: number): void;
    back(): void;
    forward(): void;
}
interface IHistory {
    start?(): void;
    destroy?(): void;
    push(path: string, search: string, hash: string, state?: any): void;
    replace(path: string, search: string, hash: string, state?: any): void;
    go(index: number): [string, string, string, any] | undefined;
    back(): [string, string, string, any] | undefined;
    forward(): [string, string, string, any] | undefined;
    link(props: IHistoryLinkProps, context: Neep.ShellContext<any>, onClick: () => void): Neep.Element;
}
interface History {
    push(location: Location, state?: any): Promise<void>;
    replace(location: Location, state?: any): Promise<void>;
    go(index: number): void;
    back(): void;
    forward(): void;
}
interface Location {
    path?: string;
    search?: string;
    hash?: string;
    query?: string;
    alias?: string;
    params?: object;
    append?: boolean;
}
interface Match {
    path: string;
    params: object;
    route: Route;
}
declare global {
    namespace JSX {
        interface IntrinsicElements {
            RouterView: ViewProps;
            'router-view': ViewProps;
            RouterLink: LinkProps;
            'router-link': LinkProps;
        }
    }
}

declare function install(Neep: typeof Neep): void;

declare let withRouter: (() => RouteContext | undefined);

declare const ScopeSlot = "core:scopeslot";
declare const Render = "core:render";
declare const Slot = "core:slot";
declare const Container = "core:container";
declare const Template = "template";
declare const Fragment = "template";

declare const _mp_rt1____constant_tags___ScopeSlot: typeof ScopeSlot;
declare const _mp_rt1____constant_tags___Render: typeof Render;
declare const _mp_rt1____constant_tags___Slot: typeof Slot;
declare const _mp_rt1____constant_tags___Container: typeof Container;
declare const _mp_rt1____constant_tags___Template: typeof Template;
declare const _mp_rt1____constant_tags___Fragment: typeof Fragment;
declare namespace _mp_rt1____constant_tags__ {
  export {
    _mp_rt1____constant_tags___ScopeSlot as ScopeSlot,
    _mp_rt1____constant_tags___Render as Render,
    _mp_rt1____constant_tags___Slot as Slot,
    _mp_rt1____constant_tags___Container as Container,
    _mp_rt1____constant_tags___Template as Template,
    _mp_rt1____constant_tags___Fragment as Fragment,
  };
}

declare const rendererSymbol: unique symbol;
declare const nameSymbol: unique symbol;
declare const componentsSymbol: unique symbol;
declare const propsSymbol: unique symbol;
declare const componentValueSymbol: unique symbol;
declare const objectTypeSymbol: unique symbol;
declare const objectTypeSymbolElement = "$$$objectType$$$Element";
declare const objectTypeSymbolDeliverComponent = "$$$objectType$$$DeliverComponent";
declare const objectTypeSymbolNativeComponent = "$$$objectType$$$NativeComponentNode";
declare const objectTypeSymbolSimpleComponent = "$$$objectType$$$SimpleComponent";
declare const objectTypeSymbolShellComponent = "$$$objectType$$$ShellComponent";
declare const objectTypeSymbolRenderComponent = "$$$objectType$$$RenderComponent";
declare const objectTypeSymbolContainerComponent = "$$$objectType$$$ContainerComponent";
declare const objectTypeSymbolElementComponent = "$$$objectType$$$ElementComponent";
declare const deliverKeySymbol: unique symbol;
declare const deliverDefaultSymbol: unique symbol;

declare type EmitProps<T> = undefined extends T ? [] | [T] : void extends T ? [] | [T] : never extends T ? [] | [T] : [T];
interface Emit<T extends Record<string, any> = Record<string, any>> {
    <N extends keyof T & string>(name: N, ...p: EmitProps<T[N]>): boolean;
    <N extends keyof T & string>(name: N, p: T[N]): boolean;
    omit(...names: string[]): Emit;
    readonly names: (keyof T)[];
}
interface EventSet {
    [key: string]: (...p: any[]) => void;
}
interface EventInfo<T> {
    readonly target: any;
    readonly cancelable: boolean;
    readonly defaultPrevented: boolean;
    readonly prevented: boolean;
    preventDefault(): void;
    prevent(): void;
}
interface Listener<T, P> {
    (p: P, event: EventInfo<T>): void;
}
interface On<T, E extends Record<string, any>> {
    <N extends keyof E & string>(name: N, listener: Listener<T, E[N]>): () => void;
}

declare const NativeElementSymbol: unique symbol;
declare const NativeTextSymbol: unique symbol;
declare const NativeComponentSymbol: unique symbol;
declare const NativePlaceholderSymbol: unique symbol;
declare const NativeShadowSymbol: unique symbol;
/** 原生元素节点 */
interface NativeElementNodes {
    core: {
        [NativeElementSymbol]: true;
    };
}
/** 原生文本节点 */
interface NativeTextNodes {
    core: {
        [NativeTextSymbol]: true;
    };
}
/** 原生占位组件 */
interface NativePlaceholderNodes {
    core: {
        [NativePlaceholderSymbol]: true;
    };
}
/** 原生组件 */
interface NativeComponentNodes {
    core: {
        [NativeComponentSymbol]: true;
    };
}
/** 原生组件内部 */
interface NativeShadowNodes {
    core: {
        [NativeShadowSymbol]: true;
    };
}
/** 原生元素节点 */
declare type NativeElementNode = ValueOf<NativeElementNodes>;
/** 原生文本节点 */
declare type NativeTextNode = ValueOf<NativeTextNodes>;
/** 原生占位组件 */
declare type NativePlaceholderNode = ValueOf<NativePlaceholderNodes>;
/** 原生组件 */
declare type NativeComponentNode = ValueOf<NativeComponentNodes>;
/** 原生组件内部 */
declare type NativeShadowNode = ValueOf<NativeShadowNodes>;
declare type ValueOf<T extends object> = T[keyof T];
declare type NativeContainerNode = NativeElementNode | NativeComponentNode | NativeShadowNode;
declare type NativeNode = NativeContainerNode | NativeTextNode | NativePlaceholderNode;
declare type MountOptions = Record<string, any>;
interface MountContainerResult {
    container: NativeContainerNode;
    target: NativeContainerNode | null;
    insert: NativeNode | null;
    next: NativeNode | null;
    exposed: any;
}
interface UpdateContainerResult {
    target: NativeContainerNode | null;
    insert: NativeNode | null;
    next: NativeNode | null;
}
interface IRenderer<T = any> {
    type: string;
    nextFrame?(this: this, fn: () => void): void;
    getContainer(this: this, container: NativeContainerNode, target: any, next: any): [NativeContainerNode | null, NativeNode | null];
    /**
     * 创建挂载容器组件
     * @param data 创建数据
     * @param props 创建参数
     * @param parent 父渲染器
     */
    mountContainer(this: this, data: T, props: Record<string, any>, emit: Emit<Record<string, any>>, parent: IRenderer | undefined): MountContainerResult;
    updateContainer(this: this, container: NativeContainerNode, target: NativeContainerNode | null, insert: NativeNode | null, next: NativeNode | null, data: T, props: Record<string, any>, emit: Emit<Record<string, any>>, parent: IRenderer | undefined): UpdateContainerResult;
    recoveryContainer(this: this, container: NativeContainerNode, target: NativeContainerNode | null, insert: NativeNode | null, next: NativeNode | null, newTarget: NativeContainerNode | null, newInsert: NativeNode | null, newNext: NativeNode | null, data: T, props: Record<string, any>, parent: IRenderer | undefined): void;
    unmountContainer(this: this, container: NativeContainerNode, target: NativeContainerNode | null, insert: NativeNode | null, next: NativeNode | null, data: T, props: Record<string, any>, parent: IRenderer | undefined): void;
    getMountOptions(this: this, node: NativeNode, options: MountOptions): MountOptions | undefined | void;
    isNode(this: this, v: any): v is NativeNode;
    createElement(this: this, data: string | T, props: Record<string, any>, mountOptions: MountOptions): NativeElementNode | null;
    updateProps(this: this, node: NativeElementNode, data: string | T, props: Record<string, any>, emit: Emit<Record<string, any>>, mountOptions: MountOptions): void;
    createText(this: this, text: string): NativeTextNode;
    createPlaceholder(this: this): NativePlaceholderNode;
    createComponent?(this: this): [NativeComponentNode, NativeShadowNode];
    getParent(this: this, node: NativeNode): NativeContainerNode | null;
    nextNode(this: this, node: NativeNode): NativeNode | null;
    insertNode(this: this, parent: NativeContainerNode, node: NativeNode, next?: NativeNode | null): void;
    removeNode(this: this, n: NativeNode): void;
}

interface Entity<T, TEmit extends Record<string, any>> {
    readonly exposed?: T;
    data: Record<string, any>;
    readonly on: On<T, TEmit>;
    readonly emit: Emit<TEmit>;
}

interface SlotApi {
    (name?: string, argv?: any): Element;
    has(name?: string): boolean;
}

/** 上下文环境 */
interface Context<TExpose extends object, TEmit extends Record<string, any>> {
    by<P extends any[], R>(fn: (...p: P) => R, ...p: P): R;
    /** 作用域槽 */
    slot: SlotApi;
    emit: Emit<TEmit>;
    childNodes(): any[];
    expose?(value?: TExpose): void;
}
/** 上下文环境 */
interface ShellContext<TEmit extends Record<string, any>> extends Context<never, TEmit> {
    expose?: undefined;
}
/** 上下文环境 */
interface ComponentContext<TExpose extends object, TEmit extends Record<string, any>> extends Context<TExpose, TEmit> {
    expose(value?: TExpose): void;
}

interface SelfComponent<TProps extends object> {
    (props: TProps): Element<this>;
}
/** 构造函数 */
interface ComponentFunc<TProps extends object, TExpose extends object, TEmit extends Record<string, any>> {
    (props: TProps, context: ComponentContext<TExpose, TEmit>): Node;
}
interface SimpleComponentFunc<TProps extends object, TEmit extends Record<string, any>> {
    (props: TProps, context: ShellContext<TEmit>): Node;
}
interface ShellComponentFunc<TProps extends object, TEmit extends Record<string, any>> {
    (props: TProps, context: ShellContext<TEmit>): Node;
}
interface DeliverComponent<T> extends SelfComponent<{
    value?: T;
}> {
    readonly [objectTypeSymbol]: typeof objectTypeSymbolDeliverComponent;
    readonly [deliverKeySymbol]: symbol;
    readonly [deliverDefaultSymbol]: T;
}
interface RenderComponent<TProps extends object, TExpose extends object, TEmit extends Record<string, any>> extends SelfComponent<TProps> {
    readonly [objectTypeSymbol]: typeof objectTypeSymbolRenderComponent;
    readonly [componentValueSymbol]: ComponentFunc<TProps, TExpose, TEmit>;
    readonly [nameSymbol]?: string;
    readonly [componentsSymbol]?: Record<string, Component<any>>;
    readonly [propsSymbol]?: (keyof TProps)[];
}
interface ContainerComponent<P extends object, T = any> extends SelfComponent<P> {
    readonly [objectTypeSymbol]: typeof objectTypeSymbolContainerComponent;
    readonly [componentValueSymbol]: T;
    readonly [nameSymbol]?: string;
    readonly [rendererSymbol]?: string | IRenderer;
}
interface ElementComponent<P extends object, T> extends SelfComponent<P> {
    readonly [objectTypeSymbol]: typeof objectTypeSymbolElementComponent;
    readonly [componentValueSymbol]: T;
    readonly [nameSymbol]?: string;
}
interface StandardComponent<TProps extends object, TExpose extends object, TEmit extends Record<string, any>> extends ComponentFunc<TProps, TExpose, TEmit> {
    /** 组件名称 */
    [nameSymbol]?: string;
    [componentsSymbol]?: Record<string, Component<any>>;
    [objectTypeSymbol]?: typeof objectTypeSymbolNativeComponent;
    [propsSymbol]?: (keyof TProps)[];
}
interface SimpleComponent<TProps extends object, TEmit extends Record<string, any>> extends SimpleComponentFunc<TProps, TEmit> {
    [objectTypeSymbol]: typeof objectTypeSymbolSimpleComponent;
    /** 组件名称 */
    [nameSymbol]?: string;
    [componentsSymbol]?: Record<string, Component<any>>;
}
interface ShellComponent<TProps extends object, TEmit extends Record<string, any>> extends ShellComponentFunc<TProps, TEmit> {
    [objectTypeSymbol]: typeof objectTypeSymbolShellComponent;
    /** 组件名称 */
    [nameSymbol]?: string;
}
declare type Component<P extends object = any> = StandardComponent<P, any, any> | SimpleComponent<P, any> | ShellComponent<P, any> | ContainerComponent<P> | ElementComponent<P, any> | DeliverComponent<P extends {
    value?: infer T;
} ? T : any>;

declare type Tags = typeof _mp_rt1____constant_tags__;
declare type CoreTags = Tags[keyof Tags];
declare type Tag<P extends object> = string | CoreTags | Component<P> | RenderComponent<P, any, any>;
interface Element<T extends Tag<any> = Tag<any>> {
    [objectTypeSymbol]: typeof objectTypeSymbolElement;
    /** 标签名 */
    tag: T;
    /** 属性 */
    props?: {
        [key: string]: any;
    };
    /** 子节点 */
    children: any[];
    /** 插槽 */
    slot?: string;
    /** 列表对比 key */
    key?: any;
    /** 槽是否是已插入的 */
    inserted?: boolean;
    /** 是否为槽默认值 */
    isDefault?: boolean;
    /** 简单组件，是否是已经执行的 */
    execed?: boolean;
}
/** source 对象 */
declare type Node = Element | null;

interface Ref<TExposed extends object | Function, TEntity extends Entity<any, any>> {
    (newNode: TExposed | undefined, oldNode: TExposed | undefined, entity: TEntity, 
    /**
     * true: 添加
     * false: 移除
     */
    state?: boolean): void;
}

interface Attributes<T extends object> {
    slot?: string;
    'n:ref'?: Ref<T, Entity<any, any>>;
    'n-ref'?: Ref<T, Entity<any, any>>;
    '@'?: Emit | EventSet;
    'n:on'?: Emit | EventSet;
    'n-on'?: Emit | EventSet;
}
interface NativeAttributes extends Attributes<any> {
    id?: string | Value<string>;
    class?: string | Value<string>;
}
interface ClassAttributes<T> extends Attributes<T & object> {
}
interface SlotAttr {
    name?: string;
}
interface ScopeSlotAttr {
    name?: string;
    render?(...params: any[]): Node | Node[];
}
interface SlotRenderAttr {
}
interface CoreIntrinsicElements {
    [Slot]: SlotAttr & ScopeSlotAttr;
    [Render]: SlotRenderAttr;
    [ScopeSlot]: ScopeSlotAttr;
    slot: SlotAttr;
}
declare type NeepElement = Element;
declare global {
    namespace JSX {
        interface IntrinsicAttributes extends NativeAttributes {
        }
        interface IntrinsicClassAttributes<T> extends ClassAttributes<T> {
        }
        interface Element extends NeepElement {
        }
        interface IntrinsicElements extends CoreIntrinsicElements {
            [k: string]: any;
        }
    }
}

declare const _default: ShellComponent<ViewProps, any>;

declare const _default$1: ShellComponent<LinkProps, any>;

export default Router;
export { History, IHistory, IHistoryLinkProps, LinkProps, Location, Match, StoreHistory as Memory, Route, RouteConfig, RouteContext, _default$1 as RouterLink, _default as RouterView, ViewProps, WebPathHistory$1 as WebHash, WebPathHistory as WebPath, install, withRouter };
