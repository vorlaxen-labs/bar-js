import { BaRHooks, ResponseBuilder } from '../src/core';

describe('BaR Unit Tests', () => {

    // ─── Builder Temel ─────────────────────────────────────────────────────
    describe('Builder - Temel Mantık', () => {

        it('varsayılan response shape doğru olmalı', () => {
            const res = new ResponseBuilder().build();

            expect(res.body).toMatchObject({
                success: true,
                message: "Operation successful",
                data: null,
                timestamp: expect.any(String),
                metadata: expect.objectContaining({
                    request_id: expect.any(String),
                    server_time: expect.any(String),
                    status_code: 200,
                }),
            });
            expect(res.statusCode).toBe(200);
        });

        it('status() success flag\'i otomatik belirlemeli', () => {
            expect(new ResponseBuilder().status(201).build().body.success).toBe(true);
            expect(new ResponseBuilder().status(400).build().body.success).toBe(false);
            expect(new ResponseBuilder().status(500).build().body.success).toBe(false);
        });

        it('forceSuccess() manuel override edebilmeli', () => {
            const res1 = new ResponseBuilder().status(200).forceSuccess(false).build();
            const res2 = new ResponseBuilder().status(500).forceSuccess(true).build();

            expect(res1.body.success).toBe(false);
            expect(res2.body.success).toBe(true);
        });

        it('setHeaders() hem tekil hem obje olarak çalışmalı', () => {
            const res = new ResponseBuilder()
                .setHeaders('X-Single', 'val1')
                .setHeaders({ 'X-Multi': 'val2', 'X-Auth': 'secret' })
                .build();

            expect(res.headers['X-Single']).toBe('val1');
            expect(res.headers['X-Multi']).toBe('val2');
            expect(res.headers['X-Auth']).toBe('secret');
        });

        it('setCookies() kuyruğa doğru eklemeli', () => {
            const res = new ResponseBuilder()
                .setCookies('session', '123', { httpOnly: true })
                .setCookies({ theme: 'dark' })
                .build();

            expect(res.cookies).toContainEqual({ name: 'session', value: '123', options: { httpOnly: true } });
            expect(res.cookies).toContainEqual({ name: 'theme', value: 'dark', options: undefined });
        });
    });

    // ─── Gelişmiş Özellikler (Wrap, Transform, When) ───────────────────────
    describe('Builder - Gelişmiş Fonksiyonlar', () => {

        it('wrap() başarılı promise verisini set etmeli', async () => {
            const builder = new ResponseBuilder();
            await builder.wrap(Promise.resolve({ id: 1 }));
            const res = builder.build();

            expect(res.body.data).toEqual({ id: 1 });
            expect(res.statusCode).toBe(200);
        });

        it('wrap() reject durumunda 500 dönmeli', async () => {
            const builder = new ResponseBuilder();
            await builder.wrap(Promise.reject(new Error('DB Error')));
            const res = builder.build();

            expect(res.statusCode).toBe(500);
            expect(res.body.message).toBe('DB Error');
            expect(res.body.success).toBe(false);
        });

        it('transform() veriyi manipüle etmeli', () => {
            const res = new ResponseBuilder<number>()
                .data(10)
                .transform(n => n * 2)
                .transform(n => `Sayı: ${n}`)
                .build();

            expect(res.body.data).toBe("Sayı: 20");
        });

        it('when() koşula göre çalışmalı', () => {
            const builder = (isAdmin: boolean) => 
                new ResponseBuilder()
                    .when(isAdmin, b => b.setHeaders('X-Admin', 'true'))
                    .build();

            expect(builder(true).headers['X-Admin']).toBe('true');
            expect(builder(false).headers['X-Admin']).toBeUndefined();
        });

        it('paginate() metadata’yı doğru hesaplamalı', () => {
            const res = new ResponseBuilder()
                .paginate(100, 2, 20) // total, page, limit
                .build();

            expect(res.body.metadata.pagination).toEqual({
                total: 100,
                page: 2,
                limit: 20,
                total_pages: 5,
                has_next: true
            });
        });
    });

    // ─── Hooks & Context ───────────────────────────────────────────────────
    describe('Hooks & Context', () => {

        it('before_build ve after_build akışı doğru olmalı', () => {
            const beforeFn = jest.fn();
            const afterFn = jest.fn();
            const hooks = new BaRHooks();
            hooks.on('before_build', beforeFn);
            hooks.on('after_build', afterFn);

            new ResponseBuilder(undefined, { hooks }).status(201).build();

            expect(beforeFn).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 201 }));
            expect(afterFn).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 201 }));
        });

        it('after_build hook payload immutable olmalı (structuredClone testi)', () => {
            const hooks = new BaRHooks();
            hooks.on('after_build', (payload) => {
                payload.body.success = false; // Mutasyon denemesi
            });

            const res = new ResponseBuilder(undefined, { hooks }).status(200).build();
            expect(res.body.success).toBe(true); // Orijinal sonuç değişmemeli
        });
    });

    // ─── Presets (as.factory) ──────────────────────────────────────────────
    describe('ResponseAs - Presets', () => {
        const builder = () => new ResponseBuilder();

        it('as.ok() veriyi ve statusu set etmeli', () => {
            const res = builder().as.ok('test-data', 'SuccessMsg').build();
            expect(res.statusCode).toBe(200);
            expect(res.body.data).toBe('test-data');
            expect(res.body.message).toBe('SuccessMsg');
        });

        it('as.notFound() hata formatına uymalı', () => {
            const res = builder().as.notFound('Resource not found').build();
            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Resource not found');
        });

        it('as.noContent() data null olmalı', () => {
            const res = builder().as.noContent().build();
            expect(res.statusCode).toBe(204);
            expect(res.body.data).toBeNull();
        });
    });
});