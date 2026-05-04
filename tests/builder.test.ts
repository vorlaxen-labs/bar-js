import { BaR } from '../src/index';
import { BaRHooks } from '../src/core';

describe('BaR Unit Tests', () => {

    // ─── Builder Temel ─────────────────────────────────────────────────────

    describe('Builder - Temel', () => {

        it('varsayılan response shape doğru olmalı', () => {
            const res = new BaR().build();

            expect(res.body).toMatchObject({
                success: true,
                message: expect.any(String),
                data: null,
                timestamp: expect.any(String),
                metadata: expect.objectContaining({
                    request_id: expect.any(String),
                    server_time: expect.any(String),
                    status_code: expect.any(Number),
                }),
            });
            expect(res.statusCode).toBe(200);
            expect(res.headers).toEqual({});
        });

        it('status() success flag\'i otomatik set etmeli', () => {
            expect(new BaR().status(200).build().body.success).toBe(true);
            expect(new BaR().status(201).build().body.success).toBe(true);
            expect(new BaR().status(301).build().body.success).toBe(true);
            expect(new BaR().status(400).build().body.success).toBe(false);
            expect(new BaR().status(401).build().body.success).toBe(false);
            expect(new BaR().status(500).build().body.success).toBe(false);
        });

        it('success() flag\'i manuel override edebilmeli', () => {
            const res1 = new BaR().status(200).success(false).build();
            const res2 = new BaR().status(500).success(true).build();

            expect(res1.body.success).toBe(false);
            expect(res2.body.success).toBe(true);
        });

        it('message() doğru set edilmeli', () => {
            const res = new BaR().message('Merhaba BaR').build();
            expect(res.body.message).toBe('Merhaba BaR');
        });

        it('message() verilmezse varsayılan mesaj gelmeli', () => {
            const success = new BaR().status(200).build();
            const failure = new BaR().status(400).build();

            expect(success.body.message).toBe('Operation successful');
            expect(failure.body.message).toBe('Operation failed');
        });

        it('data() payload\'ı doğru set etmeli', () => {
            const payload = { id: 1, name: 'Vorlaxen' };
            const res = new BaR().data(payload).build();
            expect(res.body.data).toEqual(payload);
        });

        it('data() null kabul etmeli', () => {
            const res = new BaR().data(null).build();
            expect(res.body.data).toBeNull();
        });

        it('data() array kabul etmeli', () => {
            const list = [1, 2, 3];
            const res = new BaR().data(list).build();
            expect(res.body.data).toEqual(list);
        });

        it('header() tek header ekleyebilmeli', () => {
            const res = new BaR().header('X-Test', 'value').build();
            expect(res.headers['X-Test']).toBe('value');
        });

        it('header() birden fazla header ekleyebilmeli', () => {
            const res = new BaR()
                .header('X-A', '1')
                .header('X-B', '2')
                .header('X-C', '3')
                .build();

            expect(res.headers['X-A']).toBe('1');
            expect(res.headers['X-B']).toBe('2');
            expect(res.headers['X-C']).toBe('3');
        });

        it('statusCode response\'a yansımalı', () => {
            expect(new BaR().status(201).build().statusCode).toBe(201);
            expect(new BaR().status(404).build().statusCode).toBe(404);
            expect(new BaR().status(500).build().statusCode).toBe(500);
        });

        it('timestamp ISO 8601 formatında olmalı', () => {
            const res = new BaR().build();
            expect(() => new Date(res.body.timestamp).toISOString()).not.toThrow();
        });

        it('fluent chain tüm metodlarla çalışmalı', () => {
            const res = new BaR()
                .status(201)
                .message('Chained')
                .data({ ok: true })
                .header('X-Chain', 'yes')
                .success(true)
                .build();

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe('Chained');
            expect(res.body.data).toEqual({ ok: true });
            expect(res.headers['X-Chain']).toBe('yes');
            expect(res.body.success).toBe(true);
        });
    });

    // ─── ResponseAs Presets ────────────────────────────────────────────────

    describe('ResponseAs - Presets', () => {

        // 2xx
        it('as.ok() → 200, success: true', () => {
            const res = new BaR().as.ok({ hello: 'world' }, 'All good').build();
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual({ hello: 'world' });
            expect(res.body.message).toBe('All good');
        });

        it('as.ok() data olmadan çağrılabilmeli', () => {
            const res = new BaR().as.ok().build();
            expect(res.statusCode).toBe(200);
        });

        it('as.created() → 201', () => {
            const res = new BaR().as.created({ id: 42 }).build();
            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('as.accepted() → 202', () => {
            const res = new BaR().as.accepted().build();
            expect(res.statusCode).toBe(202);
            expect(res.body.success).toBe(true);
        });

        it('as.noContent() → 204', () => {
            const res = new BaR().as.noContent().build();
            expect(res.statusCode).toBe(204);
            expect(res.body.data).toBeNull();
        });

        // 4xx
        it('as.badRequest() → 400, success: false', () => {
            const res = new BaR().as.badRequest('Geçersiz veri').build();
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Geçersiz veri');
        });

        it('as.unauthorized() → 401', () => {
            const res = new BaR().as.unauthorized('Yetkisiz').build();
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.data).toBeNull();
        });

        it('as.forbidden() → 403', () => {
            const res = new BaR().as.forbidden().build();
            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('as.notFound() → 404', () => {
            const res = new BaR().as.notFound().build();
            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('as.conflict() → 409', () => {
            const res = new BaR().as.conflict().build();
            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('as.unprocessable() → 422', () => {
            const res = new BaR().as.unprocessable().build();
            expect(res.statusCode).toBe(422);
            expect(res.body.success).toBe(false);
        });

        it('as.tooManyRequests() → 429', () => {
            const res = new BaR().as.tooManyRequests().build();
            expect(res.statusCode).toBe(429);
            expect(res.body.success).toBe(false);
        });

        // 5xx
        it('as.internalServerError() → 500', () => {
            const res = new BaR().as.internalServerError().build();
            expect(res.statusCode).toBe(500);
            expect(res.body.success).toBe(false);
        });

        it('as.serviceUnavailable() → 503', () => {
            const res = new BaR().as.serviceUnavailable().build();
            expect(res.statusCode).toBe(503);
            expect(res.body.success).toBe(false);
        });

        it('as.gatewayTimeout() → 504', () => {
            const res = new BaR().as.gatewayTimeout().build();
            expect(res.statusCode).toBe(504);
            expect(res.body.success).toBe(false);
        });

        it('preset sonrası chain devam edebilmeli', () => {
            const res = new BaR().as.ok({ x: 1 }).header('X-Extra', 'yes').build();
            expect(res.headers['X-Extra']).toBe('yes');
        });
    });

    // ─── Metadata ──────────────────────────────────────────────────────────

    describe('Metadata', () => {

        it('her build() unique request_id üretmeli', () => {
            const ids = new Set(
                Array.from({ length: 20 }, () => new BaR().build().body.metadata.request_id)
            );
            expect(ids.size).toBe(20);
        });

        it('metadata.status_code builder status\'u ile eşleşmeli', () => {
            expect(new BaR().status(201).build().body.metadata.status_code).toBe(201);
            expect(new BaR().status(404).build().body.metadata.status_code).toBe(404);
        });

        it('setMeta() custom alanlar ekleyebilmeli', () => {
            const res = new BaR()
                .setMeta({ version: '2.0', env: 'test' })
                .build();

            expect(res.body.metadata.version).toBe('2.0');
            expect(res.body.metadata.env).toBe('test');
        });

        it('setMeta() birden fazla kez çağrılabilmeli ve merge edilmeli', () => {
            const res = new BaR()
                .setMeta({ a: 1 })
                .setMeta({ b: 2 })
                .build();

            expect(res.body.metadata.a).toBe(1);
            expect(res.body.metadata.b).toBe(2);
        });

        it('withMetadata() status_code inject etmeli', () => {
            const res = new BaR().status(422).withMetadata().build();
            expect(res.body.metadata.status_code).toBe(422);
        });

        it('context request_id metadata\'ya yansımalı', () => {
            const ctx = {
                request_id: 'test-ctx-id-123',
                start_time: Date.now(),
            };

            const builder = new BaR(undefined, undefined, ctx);
            const res = builder.build();

            expect(res.body.metadata.request_id).toBe('test-ctx-id-123');
        });
    });

    // ─── Hooks ─────────────────────────────────────────────────────────────

    describe('Hooks', () => {

        it('before_build hook tetiklenmeli', () => {
            const fn = jest.fn();
            const hooks = new BaRHooks();
            hooks.on('before_build', fn);

            new BaR(undefined, { hooks }).build();

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 200 }));
        });

        it('after_build hook tetiklenmeli ve result içermeli', () => {
            const fn = jest.fn();
            const hooks = new BaRHooks();
            hooks.on('after_build', fn);

            new BaR(undefined, { hooks }).as.ok({ x: 1 }).build();

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn.mock.calls[0][0].body.success).toBe(true);
        });

        it('before_dispatch ve after_dispatch dispatcher varsa tetiklenmeli', () => {
            const beforeDispatch = jest.fn();
            const afterDispatch = jest.fn();
            const hooks = new BaRHooks();
            hooks.on('before_dispatch', beforeDispatch);
            hooks.on('after_dispatch', afterDispatch);

            const dispatcher = { dispatch: jest.fn((r) => r) };
            new BaR(dispatcher, { hooks }).build();

            expect(beforeDispatch).toHaveBeenCalledTimes(1);
            expect(afterDispatch).toHaveBeenCalledTimes(1);
        });

        it('dispatcher yoksa dispatch hook\'ları tetiklenmemeli', () => {
            const beforeDispatch = jest.fn();
            const hooks = new BaRHooks();
            hooks.on('before_dispatch', beforeDispatch);

            new BaR(undefined, { hooks }).build();

            expect(beforeDispatch).not.toHaveBeenCalled();
        });

        it('hook throw ederse builder çökmemeli', () => {
            const hooks = new BaRHooks();
            hooks.on('before_build', () => { throw new Error('hook patladı'); });

            expect(() => new BaR(undefined, { hooks }).build()).not.toThrow();
        });

        it('aynı event\'e birden fazla hook eklenebilmeli', () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            const fn3 = jest.fn();
            const hooks = new BaRHooks();
            hooks.on('after_build', fn1);
            hooks.on('after_build', fn2);
            hooks.on('after_build', fn3);

            new BaR(undefined, { hooks }).build();

            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).toHaveBeenCalledTimes(1);
            expect(fn3).toHaveBeenCalledTimes(1);
        });

        it('hook payload immutable olmalı — hook içi mutasyon response\'u etkilememeli', () => {
            const hooks = new BaRHooks();
            hooks.on('after_build', (payload) => {
                payload.body.success = false; // mutasyon denemesi
            });

            const res = new BaR(undefined, { hooks }).as.ok().build();
            // hook payload'ı değiştirse bile build sonucu değişmemeli
            expect(res.body.success).toBe(true);
        });
    });

    // ─── Logger ────────────────────────────────────────────────────────────

    describe('Logger', () => {

        it('build() sırasında logger.debug çağrılmalı', () => {
            const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
            new BaR(undefined, { logger }).build();
            expect(logger.debug).toHaveBeenCalledTimes(1);
        });

        it('dispatch sırasında logger.info çağrılmalı', () => {
            const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
            const dispatcher = { dispatch: jest.fn((r) => r) };
            new BaR(dispatcher, { logger }).build();
            expect(logger.info).toHaveBeenCalledTimes(1);
        });

        it('logger olmadan build() hata vermemeli', () => {
            expect(() => new BaR(undefined, {}).build()).not.toThrow();
        });
    });

    // ─── Dispatcher ────────────────────────────────────────────────────────

    describe('Dispatcher', () => {

        it('dispatcher varsa dispatch() çağrılmalı', () => {
            const dispatcher = { dispatch: jest.fn((r) => r) };
            new BaR(dispatcher).build();
            expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
        });

        it('dispatcher build result\'ı almalı', () => {
            const dispatcher = { dispatch: jest.fn((r) => r) };
            new BaR(dispatcher).as.ok({ x: 1 }, 'Test').build();

            const dispatched = dispatcher.dispatch.mock.calls[0][0];
            expect(dispatched.body.success).toBe(true);
            expect(dispatched.body.data).toEqual({ x: 1 });
            expect(dispatched.statusCode).toBe(200);
        });

        it('dispatcher olmadan build() result döndürmeli', () => {
            const res = new BaR().as.notFound('Yok').build();
            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Yok');
        });
    });
});