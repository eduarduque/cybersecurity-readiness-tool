import React, { Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

const SearchParamsClient = () => {
    const [searchParams] = useSearchParams();
    return (
        <div>
            <h3>Search Parameters</h3>
            <pre>{JSON.stringify(Object.fromEntries(searchParams), null, 2)}</pre>
        </div>
    );
};

export default () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchParamsClient />
        </Suspense>
    );
};