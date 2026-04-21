/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Booking } from '../models/Booking';
import type { CreateBookingRequest } from '../models/CreateBookingRequest';
import type { EventType } from '../models/EventType';
import type { Slot } from '../models/Slot';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GuestService {
    /**
     * @param requestBody
     * @returns Booking The request has succeeded.
     * @throws ApiError
     */
    public static bookingsPublicCreateBooking(
        requestBody: CreateBookingRequest,
    ): CancelablePromise<Booking> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/bookings',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `The server could not understand the request due to invalid syntax.`,
                404: `The server cannot find the requested resource.`,
                409: `The request conflicts with the current state of the server.`,
            },
        });
    }
    /**
     * @returns EventType The request has succeeded.
     * @throws ApiError
     */
    public static eventTypesPublicListEventTypes(): CancelablePromise<Array<EventType>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/event-types',
            errors: {
                400: `The server could not understand the request due to invalid syntax.`,
                404: `The server cannot find the requested resource.`,
                409: `The request conflicts with the current state of the server.`,
            },
        });
    }
    /**
     * @param id
     * @returns Slot The request has succeeded.
     * @throws ApiError
     */
    public static slotsGetAvailableSlots(
        id: string,
    ): CancelablePromise<Array<Slot>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/event-types/{id}/slots',
            path: {
                'id': id,
            },
            errors: {
                400: `The server could not understand the request due to invalid syntax.`,
                404: `The server cannot find the requested resource.`,
                409: `The request conflicts with the current state of the server.`,
            },
        });
    }
}
