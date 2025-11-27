import React from 'react';

export const HelloWorld = () => {
    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="text-center">
                <h1 className="mb-4">Team Name: BusyBug</h1>
                <ul className="list-group">
                    <li className="list-group-item">Marquez, Paulo</li>
                    <li className="list-group-item">Garcia, Cris Charles</li>
                    <li className="list-group-item">De Vera, Ermhar</li>
                    <li className="list-group-item">Patriarca, Rachelle</li>
                    <li className="list-group-item">Antonio, Clara Maris</li>
                    <li className="list-group-item">Tenorio, Paula Eunice</li>
                </ul>
            </div>
        </div>
    );
};

export default HelloWorld;