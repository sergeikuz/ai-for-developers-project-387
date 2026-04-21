/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Booking } from '../models/Booking';
import type { CreateEventTypeRequest } from '../models/CreateEventTypeRequest';
import type { EventType } from '../models/EventType';
import type { UpdateEventTypeRequest } from '../models/UpdateEventTypeRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OwnerService {
    /**
     * @returns Booking The request has succeeded.
     * @throws ApiError
     */
    public static bookingsAdminListBookings(): CancelablePromise<Array<Booking>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/bookings',
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
    public static eventTypesAdminListEventTypes(): CancelablePromise<Array<EventType>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/event-types',
            errors: {
                400: `The server could not understand the request due to invalid syntax.`,
                404: `The server cannot find the requested resource.`,
                409: `The request conflicts with the current state of the server.`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns EventType The request has succeeded.
     * @throws ApiError
     */
    public static eventTypesAdminCreateEventType(
        requestBody: CreateEventTypeRequest,
    ): CancelablePromise<EventType> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/event-types',
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
     * @param id
     * @returns EventType The request has succeeded.
     * @throws ApiError
     */
    public static eventTypesAdminGetEventType(
        id: string,
    ): CancelablePromise<EventType> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/event-types/{id}',
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
    /**
     * @param id
     * @param requestBody
     * @returns EventType The request has succeeded.
     * @throws ApiError
     */
    public static eventTypesAdminUpdateEventType(
        id: string,
        requestBody: UpdateEventTypeRequest,
    ): CancelablePromise<EventType> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/admin/event-types/{id}',
            path: {
                'id': id,
            },
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
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static eventTypesAdminDeleteEventType(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/admin/event-types/{id}',
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
