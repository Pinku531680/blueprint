# Blueprint - 

A multi-user real-time online collaboration whiteboard

## Live Demo -
https://pinku531680.github.io/blueprint/

Note - The backend is deployed on Render free-tier, so it might take a few seconds to join the room if the server is asleep because of inactivity.


### Features and implementation overview

1) **Entirely from scratch -**  Each and every functionality has been implemented from scratch without using any third-party whiteboard libraries.
2) **Collaborative Mode -** Up to 5 users can join the room and interact with the shared whiteboard with features including free-hand drawing,
   adding and formatting text, erasing, with all changes are broadcast to connected clients in real-time using web sockets.
3) **Custom Concurrency control system for board -** Inspired by database locking mechanisms, I developed my custom concurrency control system for
   the shared whiteboard so that there are no data conflicts, and no user is out of sync.
4) **Collaborative Transparency -** The board lock mechanism provides temporary, exclusive access to one user at a time. Additionally, there are properly developed indicators
   showing which user has the lock/control and for what purpose.
5) **Custom State Management -** Implemented custom state management that allows multiple-page support and a robust undo-redo functionality independently across all pages.
6) **Role-based Administrative Controls -** This feature allows role-based administrative controls for session moderation like removing users, clearing shared canvas, and
   disabling the user (after which the disabled user can also request the admin to enable them, the admin gets a dialog where he decides either to accept or reject that request).
   


Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
