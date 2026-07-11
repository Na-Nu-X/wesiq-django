# Wesiq

## 0. Installation & Setup Guide

- Follow these steps to get the development environment running on your local machine

### Windows:

#### 1. Clone the repository

- Open your terminal and clone the project using Git.
`git clone https://github.com/Na-Nu-X/wesiq-django.git`

#### 2. Setup a Virtual Environment (For IDE autocompletion)

- Type these commands to your terminal.
```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r .\wesiq\requirements.txt
```
- Note for **Visual Studio Code** / **Cursor** users: Press **CTRL + SHIFT + P**, type **"Python: Select Interpreter"**, and select the newly created virtual environment to enable proper code autocompletion.

#### 3. Configure Environment Variables

- Create a custom .env file at the root level of the project. You can use the attached **.env.example file** as a template for your variables.

#### 4. Build and Start Docker Containers

- Make sure you are outside the virtual environment (use the `deactivate` command if necessary), and run Docker.
`docker compose up -d --build`

#### 5. Run Database Migrations

- Set up your database tables by running Django migrations inside the Docker container.
`docker compose exec web python manage.py migrate`

#### 6. Update the NPM Watch Script

- Open the **wesiq/package.json** file and update the **"watch"** script to the following to ensure both TypeScript instances compile correctly on Windows.
```json
"watch": "tsc -w -p app/static/app/ts/tsconfig.json | tsc -w -p static/ts/tsconfig.json"
```

#### 7. Run the Development Batch Script

- Start the asset compilation and background processes using the provided batch script.
`.\run_dev.bat`

#### 8. Database Connection Troubleshooting (Optional)

- If you want to connect to the Database using tools like **pgAdmin** and the default connection fails, you likely have a port conflict. Change the database port mapping in the **docker-compose.yml** file located in the root directory.
```yaml
ports:
  - "5433:5432"
```

### Linux:

#### 1. Clone the repository

- Open your terminal and clone the project using Git.
`git clone https://github.com/Na-Nu-X/wesiq-django.git`

#### 2. Setup a Virtual Environment (For IDE autocompletion)

- Type these commands to your terminal.
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r wesiq/requirements.txt
```
- Note for **Visual Studio Code** / **Cursor** users: Press **CTRL + SHIFT + P**, type **"Python: Select Interpreter"**, and select the newly created virtual environment to enable proper code autocompletion.

#### 3. Configure Environment Variables

- Create a custom .env file at the root level of the project. You can use the attached **.env.example file** as a template for your variables.

#### 4. Build and Start Docker Containers

- Make sure you are outside the virtual environment (use the `deactivate` command if necessary), and run Docker.
`docker compose up -d --build`

#### 5. Run Database Migrations

- Set up your database tables by running Django migrations inside the Docker container.
`docker compose exec web python manage.py migrate`

#### 6. Run the Development Shell Script

- Start the asset compilation and background processes using the provided shell script.
`./run_dev.sh`

- If you need execution permission, change the file permissions.
`chmod +x run_dev.sh`

#### 7. Database Connection Troubleshooting (Optional)

- If you want to connect to the Database using tools like **pgAdmin** and the default connection fails, you likely have a port conflict. Change the database port mapping in the **docker-compose.yml** file located in the root directory.
```yaml
ports:
  - "5433:5432"
```

## 1. Stack Overview

The project's **Back-End** is built on popular Python-Based Web Framework called **Django**, utilizing **PostgreSQL** for Database Management instead of default SQLite. To enhance **Front-End** security and streamline debugging, **TypeScript** was implemented instead of Vanilla JavaScript. additionally, **SCSS** was utilized to accelerate and organize style development.

## 2. Services and Libraries

The application integrates several Third-Party services and Libraries to enhance functionality.

### 2.1. Google Analytics

Provides comprehensive web traffic and user behavior metrics.

### 2.2. Google OAuth 2.0

Enables seamless user authentication via Google accounts.

### 2.3. reCAPTCHA v3

Protects forms and registration processes from automated bot activity.

### 2.4. Rosetta

Simplifies the management and implementation of **Multi-Language** support, utilizing **GNU** gettext functions for translations. 
A key professional feature is the use of translated URL addresses, where each route is automatically prefixed and translated based on the selected language (e.g., /en/homepage/ for english version or /sk/domov/ for slovak version). This optimization improves the user experience for global audiences and significantly enhances **Search Engine Optimization (SEO)**.

### 2.5. Stripe

The application integrates Stripe as the primary payment gateway to facilitate secure and reliable financial transactions, minimizing security risks while handling modern payment standards.

### 2.6. Nominatim API

The application leverages the **Nominatim API** from **OpenStreetMap** in conjunction with the **GeoDjango** Library to provide advanced geospatial services and precise location-based data management.

### 2.7. Celery (Worker), Redis (Message Broker), and Flower (Monitoring Tool)

Handle High-Performance requirements for **Asynchronous** processing. The project incorporates Redis as a message broker and Celery for managing background and **Scheduled Tasks** via Celery Beat, such as automated database cleanup. Flower is utilized for Real-Time monitoring of tasks.

### 2.8. libphonenumber-js

Handles international phone number formatting and validation.

### 2.9. Chart.js

Facilitates clear data visualization through interactive graphs.

### 2.10. QuickChart.io

Since standard JavaScript-based graphs cannot be rendered directly within most e-mail clients, this service is employed to convert Chart.js configurations into high-resolution static images for e-mail attachments.

### 2.11. Git & GitHub

The entire codebase is managed and backed up using **Git** and **GitHub**. Sensitive data, including passwords and API keys, are secured via **Environment Variables** (local .env file) and excluded from version history.

### 2.12. Docker

The application is fully Dockerized, ensuring the project is bundled into a Docker Image and ready for consistent deployment within a Docker Container.

### SMTP (Simple Mail Transfer Protocol) Integration

## 3. Components

### 3.1. Navigation Interface

The Navigation Bar serves as the primary tool for seamless site-wide redirection. It is engineered with a focus on user experience and responsiveness, ensuring consistent accessibility across all devices and screen sizes.

#### 3.1.1 Core Functionalities

- **Smooth Navigation**: Integrated logic allows for a smooth auto-scroll to specific page sections when clicking designated buttons, enhancing the single-page application (SPA) feel.

- **Adaptive Design**: The component is fully responsive. It features a dynamic layout that automatically shrinks or adjusts based on screen real estate.

- **Mobile Optimization**: On smaller screens and mobile devices, the menu transitions into a "hamburger" icon, providing a clean, space-efficient interface for touch-based interaction.

### 3.2. Reviews Visualization Graph

The reviews graph provides an intuitive interface for visitors to evaluate user feedback and overall satisfaction regarding services or products. This component synthesizes complex data into a visually compelling and interactive experience.

#### 3.2.1 Functional Features

- **Rating Distribution**: The graph displays individual bars for each rating tier (1 to 5 stars), which are dynamically colored based on the percentage of total reviews.

- **Interactive Tooltips**: Users can view the exact count of reviews for a specific rating by simply hovering over the corresponding bar.

- **Summary Statistics**: The component prominently displays the average rating and the total review count, providing an immediate snapshot of customer sentiment.

#### 3.2.2 Advanced Animation and Design

To enhance user engagement, the graph incorporates a sophisticated animations.

- **Scroll-Triggered Activation**: The graph remains hidden until the user scrolls it into view, at which point a fade-in effect is triggered.

- **Dynamic Bar Loading**: Each bar executes a smooth transition, filling its length and changing its color based on the calculated percentage.

- **Numerical Counters**: Both the total review count and the average rating utilize an "increment animation," where the numbers rapidly count up to their final values simultaneously with the bar animations.

### 3.3. Cookie Policy

#### 3.3.1 Consent Management

Upon the initial visit to the website, a cookie policy consent menu promptly appears. Users retain the autonomy to select between accepting **All Cookies** or opting for **Only Essential Cookies**. This selection directly dictates future cookie storing behaviors, influencing external integrations such as **Google Analytics**.

#### 3.3.2 Change Preferences

If a user wishes to adjust their previous choices, they can easily revisit the menu by clicking the "Privacy Policy" button located within the footer section of the page.

#### 3.3.3 Saving the Choice

The user's preference is stored in a persistent cookie, ensuring the consent banner does not reappear during subsequent sessions until the cookie expires or is cleared.

### 3.4. Contact Form

#### 3.4.1 Interface

The contact form serves as a direct communication channel between users and the development team. It enables visitors to inquire about services, submit suggestions, or report technical bugs and system issues.

#### 3.4.2 Functionalities

- **Required Fields**: Users must provide essential contact information, select an appropriate subject from a categorized menu, and compose a detailed message.

- **File Support**: To provide clearer context for technical issues or specific inquiries, the system allows users to share an image or a file as direct attachment to the message.

    - **Supported Formats**: The form accepts images, videos, and common document types (e.g., PDF, DOCX).

    - **Size Limit**: A maximum file size of 25 MB is enforced to ensure reliable delivery.

- **Spam Protection**: All submissions are monitored by **reCAPTCHA v3** to protect the system from automated bot activity without interrupting the user experience.

### 3.5. Login

#### 3.5.1 User Authentication and Login

If a user has already created an account, they can log back in when their session expires or after manually logging out. The system automatically authenticates the provided credentials and either grants or denies access based on their validity.

#### 3.5.2 Social Authentication and Visual Effects

- **Third-Party Providers**: Users can choose to log in via **Google**, **Apple**, or **Facebook** accounts for faster access.

- **Interactive Design**: To enhance user engagement, the social login buttons feature a visually appealing animated border effect.

#### 3.5.3 Account Security and Recovery

- **Password Reset System**: In the event that a user forgets their credentials, an easy password reset workflow is available to restore access safely.

- **Security Notifications**: Upon every successful login, the system automatically dispatches an informational e-mail to the user. This e-mail includes instructions for resetting the password in case the access was unauthorized or compromised.

#### 3.5.4 Security Logging and Monitoring

To maintain high security standards and monitor potential brute-force attacks, the system logs every unsuccessful login attempt into a dedicated error.log file.

- **Logged Metadata & Advanced Security Alerts**: Each log entry includes the Timestamp, the IP Address of the requester, the provided e-mail address, and additional metadata regarding the authentication attempt. To elevate account security and maintain absolute transparency, successful logins automatically trigger a highly detailed notification email. This acts as a crucial first line of defense and includes:

    - **Device and Browser Identification**: By leveraging the **django-user-agents Library**, the system parses the request's User-Agent string to explicitly detail the hardware device, operating system, and web browser used for the session.

    - **Real-Time Geolocation**: Through integration with the **ip-api** service, the system dynamically translates the raw IP address into a readable geographical location (city and country).

    - **Proactive Protection**: Delivering these specific data points directly to the user empowers them to instantly spot anomalous or international login attempts and take immediate action (such as changing their Argon2 hashed password) if an unrecognized session is detected.

- **Developer Access**: This log is strictly for developer use to identify system issues or malicious patterns.

#### 3.5.5 Brute-Force Protection (Rate Limiting)

- **Security Enforcement**: To prevent automated attacks, login attempts are strictly capped at 3 failed requests per minute per IP address using the **django-ratelimit** library.

- **Dynamic Feedback**: Once the limit is reached, the system triggers an automatic cooldown period and displays an informative alert, protecting the infrastructure while keeping the user informed.

### 3.6. Registration

#### 3.6.1 User Registration and Account Creation

The registration system allows new users to intuitively create an account by clicking the registration button. Upon completing a brief form, the user's information is securely stored in the database to facilitate future logins and data retrieval.

#### 3.6.2 Key Validation And Security Features

- **Email Duplication Verification**: The system automatically checks whether the provided email address is already registered to prevent duplicate accounts.

- **Password Length Constraints**: Implements restrictions against overly short passwords to ensure robust security.

- **Dual Entry Confirmation**: Requires users to retype their password a second time to prevent input errors.

- **Secure Password Generator**: Includes an integrated function to automatically generate a strong, random password.

- **Clipboard Functionality**: Supports quick copy and paste actions for generated passwords.

- **Cryptographic Hashing:** For maximum safety, all passwords are encrypted using the **PBKDF2** algorithm with a **SHA-256** hash (via Django's secure hashing framework). Plain text passwords are never stored in the database.

- **Spam Protection**: The registration process is secured by **reCAPTCHA v3** to prevent automated bot registrations.

#### 3.6.3 Account Activation Workflow

After completing the registration form, users must verify their identity. The system automatically dispatches a unique verification link to the provided email address.

- **Link Expiration**: For security purposes, the verification link is valid for 24 hours.

- **Activation**: Full access to the account is granted only after the user clicks this link. If the link expires, the user may need to restart the registration process or request a new link.

### 3.7. Write Review

#### 3.7.1 User Review Submission

The review submission system enables users to share their personal opinions and express their overall satisfaction or experience with the services provided.

#### 3.7.2 Core Features

- **Interactive Rating System**: Ratings are visually represented using interactive star components that provide a seamless and intuitive user experience.

- **Submission Limits**: To ensure fairness and prevent manipulation, the system enforces a one review per account policy. Users cannot submit multiple separate ratings for the same service or product.

- **Review Modification Policy**: To account for input errors or evolving perspectives, users possess the ability to edit their submitted reviews once per month. This policy ensures data integrity while maintaining flexibility for the user.

- **Spam and Bot Protection**: The submission process is integrated with **reCAPTCHA v3** to identify and block automated submissions, ensuring that all feedback comes from legitimate users.

### 3.8. Edit Account

#### 3.8.1 Account Profile Management

The account profile management system empowers users to modify their personal information and profile pictures based on their individual preferences. To maintain data consistency, profile modifications are limited to once per calendar month. Additionally, the system includes dedicated functionalities to securely update passwords at any time.

#### 3.8.2 Account Deletion and Recovery

Users have the option to permanently delete their account. To prevent accidental data loss, the system implements a safety-first deletion workflow:

- **Immediate Logout & Suspension**: Upon requesting deletion, the user is instantly logged out. The account status is set to **"Suspended"**, and a 30-day grace period begins.

- **Email Notification**: An automated email is dispatched to the user confirming the deletion request and explaining that the process can be reversed simply by logging back in.

- **Account Restoration**: If the user authenticates within the 30-day window, the deletion process is automatically canceled, and the account status returns to **"Active"**.

- **Automated Permanent Deletion & Cleanup**: The system utilizes **Celery Beat** to run scheduled tasks that monitor accounts in the **"Suspended"** state. After the 30-day period expires without a login, the following actions are performed:

    - **Database Purge**: The account and all associated records are permanently and irreversibly removed from the database.

    - **Storage Optimization**: All physical files associated with the user (e.g., profile pictures) are deleted from the storage system to optimize resources.

    - **Audit Logging**: Every permanent deletion is recorded in a dedicated **celery_tasks.log** file for administrative auditing and monitoring purposes.

### 3.9. Password Reset

#### 3.9.1 Password Reset Procedure

To modify an existing password or recover access following a forgotten password, the system provides a dedicated recovery workflow designed to ensure account security.

#### 3.9.2 Verification and Redirection Workflow

- **Email Dispatch**: Upon requesting a password reset, a unique verification code is dispatched to the user's registered email address alongside detailed instructions.

- **Flexible Access**: The email includes an optional direct link that redirects to the reset page with the code automatically populated. However, clicking this link is not mandatory, as users are automatically navigated to the reset page immediately after submitting the initial request, where the code can be entered manually.

#### 3.9.3 Time Restraints and Visual Indicators

- **Ten-Minute Window**: The system enforces a strict ten-minute countdown timer for security purposes. Within this window, the user must input the verification code and their new password or utilize the integrated strong password generator.

- **Dynamic Visual Cues**: To enhance visual awareness, the timer circle dynamically shifts colors based on the remaining time, transitioning gradually from green to red. Additionally, the numerical countdown display turns bright red once the remaining time drops below ten seconds.

- **Session Expiration and Recovery**: If the timer reaches zero, an informative overlay appears, notifying the user that the verification code has expired. To ensure a smooth recovery process, a "Resend Code" option is available, allowing the user to trigger a new verification email and restart the countdown without having to navigate back to the initial request page.

### 3.10. Search Bar

#### 3.10.1 Search Bar Component

The search bar component offers an efficient method for locating specific pages by inputting the desired page title. The system executes a relevance algorithm to return the most applicable results based on the entered keywords.

#### 3.10.2 Core Functionalities and Input Controls

- **Real-Time Filtering**: Results are updated instantly as the user types, highlighting the most applicable pages based on the entered query.

- **Keyboard Navigation**: For enhanced accessibility, users can navigate through the search results or history using the Up and Down arrow keys, selecting the desired entry with Enter.

- **Query Clearance**: The input field can be instantly cleared by clicking the "X" button or using the backspace key.

- **Focus Dismissal**: To provide a non-intrusive experience, the search interface can be dismissed by clicking anywhere outside the boundary of the search bar or the results dropdown.

#### 3.10.3 Search History

- **Privacy-First Storage**: Search history is stored locally within the user's browser using **localStorage**. This ensures that history is preserved between sessions without storing personal navigation data on the server.

- **Automated Display**: To facilitate quick navigation, previous successful searches that led to visited pages are stored and displayed when the user first focuses on the search bar.

- **Entry Limitations**: To ensure only the most recent and relevant activity is visible, the history display is strictly capped at a maximum of 3 items.

- **History Control**: Users possess complete control over their data and can delete specific individual items from their saved search history at any time.

### 3.11. Articles

#### 3.11.1 Article and Blog Management System

The blog page serves as a centralized hub for educational and informational content. It features an advanced categorization system, allowing users to filter content based on specific topics of interest.

#### 3.11.2 Data Metrics and Metadata

Each individual article displays a set of essential metadata to inform the reader and track engagement:

- **Unique Visitor Count**: Tracks and displays the total number of individual users who have viewed the content.

- **Publication Date**: Clearly states the date the article was added to the platform.

- **User Attribution**: Identifies the specific author or user who created the content.

- **Rating System**: Displays the community rating for each specific piece of writing.

#### 3.11.3 Interactive User Experience

- **Hover Introductions**: The interface employs an interactive design where a short introductory text appears over a background image whenever a user hovers over an article card.

- **Content Redirection**: Clicking on a selected article redirects the user to a dedicated page housing the full body of content.

- **Engagement Forum**: Every article includes a comprehensive comment forum located directly beneath the text, facilitating community discussion and feedback.

### 3.12. Article Filtering Options

The blog interface includes intuitive filtering mechanisms to assist users in efficiently navigating and discovering relevant content.

#### 3.12.1 Core Capabilities

- **Keyword Search Integration**: Users can seamlessly filter through the available articles by typing specific terms or phrases into the integrated search bar. The list of articles updates dynamically to match the entered query in real-time.

- **Categorical Filtering**: The system provides the option to isolate and display articles based exclusively on selected topic categories. This allows for highly refined search results tailored to the user's specific interests.

- **Advanced Multi-Criteria Filtering**: Both the keyword search and categorical filters work in tandem. This allows users to combine criteria—for example, searching for a specific term within a single selected category—to achieve highly precise results.

- **Active Filter Indicators**: The interface clearly displays the currently applied filters, ensuring the user is always aware of the active search parameters.

- **Filter Reset Functionality**: A dedicated Refresh button allows users to instantly clear all active filters and keyword inputs for a given category, restoring the display to its default state.

### 3.13. Comment Forum

The comment forum facilitates community engagement by allowing users to submit personal thoughts and engage in threaded discussions beneath each article.

#### 3.13.1 Core Engagement Features

- **User Identification**: Every submitted comment or reply is prominently displayed with the author's profile picture and name to foster transparent communication.

- **Interactive Elements**: Users can actively participate by leaving direct replies to existing comments or expressing agreement through the integrated "Like" functionality.

#### 3.13.2 Moderation And Asynchronous Logic

- **Instant Interface Updates**: State changes - such as toggling a like or submitting a report - are engineered using asynchronous JavaScript (Fetch API via POST requests). This architecture guarantees immediate visual feedback and background data synchronization without requiring a full page reload, resulting in a seamless user experience.

- **Community Moderation**: To ensure a safe and respectful environment, users have the option to report harmful or inappropriate content. To prevent abuse and ensure report validity, the system securely logs the unique User ID of the reporter into the database for each submitted report. Consequently, once a comment accumulates a strict threshold of 5 distinct reports from 5 different users, it is automatically hidden from public view.

### 3.14. Activity Tracking and Training Plans

The Activity Page is a sophisticated interface designed to capture and manage user fitness data, offering both free-form activity tracking and structured training plans.

#### 3.14.1 Core Activity Tracking

- **Flexible Start Options**: Users can initiate a "Pure Activity" for general tracking or follow a specific pre-defined training plan.

- **Pause and Resume**: To accommodate real-world interruptions, the system allows users to pause and resume their activity session at any time without data loss.

- **Keyboard Shortcuts (Keybinds)**: For maximum convenience during a workout, the interface supports specific keybinds, allowing users to control tracking features without relying solely on mouse input.

- **Guest Access**: Non-authenticated users can access a "Testing Mode" to experience the tracking features. A visual warning informs them that their progress and data will not be saved upon session termination.

#### 3.14.2 Training Plan Management

- **Automated Scheduling**: Training plans are ordered chronologically by day. The system automatically suggests the plan for the current day, streamlining the user experience.

- **Structured Workflow**: Each plan is organized into a sequence of slides, including an introduction, individual exercises, and a final summary slide.

- **Progress Visualization**: A dynamic progress bar is displayed beneath the exercises. It transitions in color from yellow to green based on the percentage of completed exercises.

#### 3.14.3 Exercise Logic and Rest Periods

- **Set and Rep Tracking**: The system tracks sets, repetitions, and time-based exercises. The completion count for sets increases automatically as the user logs their progress.

- **Intelligent Rest Timer**:

    - A two-minute break is automatically triggered between exercises.

    - The countdown is represented by a timer circuit that shifts from green to red as time elapses.

    - Users can extend the break by 30 seconds via a dedicated button or manually skip the rest period to proceed immediately to the next exercise.

- **Upcoming Task Preview**: Before each new exercise, the system displays the title of the upcoming task to allow the user to prepare.

#### 3.14.4 Post-Activity Analytics

- **Performance Charts**: Upon completion, a visual chart is generated to show time spent on each exercise.

- **Historical Data**: Users can review their activity history, including total spent time, progress metrics, and the total number of recorded activities.

### 3.15. Training Plan Creation

To utilize structured tracking, users can build personalized training plans through a highly interactive and user-friendly builder interface.

#### 3.15.1 Exercise Selection and Customization

- **Intuitive Adding Mechanism**: Users can browse an extensive library of exercises and add them to their plan using drag-and-drop functionality or by double-clicking the desired item.

- **Custom Exercise Creation**: If a specific exercise is not found in the default library, the system allows users to create custom exercises to ensure the plan meets their exact needs.

- **Dynamic Scaling**: Each exercise can be tailored with specific parameters based on its type:

    - **Periods**: Organizing exercises into specific blocks or phases.

    - **Sets and Repetitions**: Defining the volume of work.

    - **Duration and Steps**: Setting hold times or step counts for isometric or cardio-based movements.

- **Automatic Sequencing**: Newly added exercises are appended to the end of the plan, with the ability to instantly switch between and modify them.

#### 3.15.2 Advanced Organization and UI Controls

- **Manual Reordering**: The sequence of the workout can be easily adjusted by dragging the exercise bars to new positions, allowing for a logical flow of the training session.

- **Effortless Removal**: To maintain a clean workflow, exercises added by mistake can be removed by simply dragging them out of the plan area or via a double-click.

- **Smart Naming and Scheduling**:

    - **Title Auto-Suggestions**: The system provides short title suggestions (e.g., "Leg Day", "Full Body") for quick setup, while still allowing full manual text input.

    - **Day Assignment**: To support the automated scheduling mentioned in Section 3.14.2, users can assign specific days of the week to each plan.

#### 3.15.3 Persistence and Management

- **Database Integration**: Once saved, the plan is stored in the user's profile and becomes immediately available for activity tracking.

- **Full CRUD Functionality**: Users maintain complete autonomy over their data, with the ability to modify, update, or delete any of their created training plans at any time.

### 3.16. Edit Training Plan

To accommodate evolving fitness goals or to correct initial input errors, the system provides a robust modification suite that allows users to refine their existing plans.

#### 3.16.1 Interface Consistency and Workflow

- **Unified Design Language**: The editing interface mirrors the "Create Training Plan" module, ensuring a seamless transition for the user. Familiar controls like drag-and-drop and double-click remain active for all modification tasks.

- **Selection Mechanism**: Users can easily browse their full library of previously created plans and select the specific one they wish to update.

#### 3.16.2 Granular Modification Options

- **Structural Adjustments**: Users have the freedom to add new exercises from the library or remove existing ones to keep their routine up to date.

- **Parameter Refinement**: Every detail of a selected plan can be modified, including:

    - **Exercise Order**: Re-sequencing movements via the drag-and-drop bars.

    - **Intensity Metrics**: Updating the number of periods, sets, repetitions, hold times, or step counts for each individual exercise.

- **Title and Scheduling Updates**: The system allows for the renaming of plans and the reassignment of training days, ensuring the "Automated Scheduling" feature (Section 3.14.2) stays synchronized with the user's current life rhythm.

#### 3.16.3 State Synchronization

- **Pre-population**: Upon selecting a plan for editing, the interface is automatically populated with all current exercise data, allowing for quick "spot corrections" without having to rebuild the plan from scratch.

- **Save and Update**: Once changes are confirmed, the system updates the database records, ensuring the next tracked activity reflects the most recent modifications.

### 3.17. Exercise Selection

The Exercise Selection tab provides a centralized repository of movements, allowing users to browse and configure individual exercises before integrating them into a training plan.

#### 3.17.1 Selection Mechanisms

- **Intuitive Integration**: Adding exercises is streamlined via an intuitive drag-and-drop system or a simple double-click action, minimizing the number of steps required to build a workout.

- **Pre-Configuration**: Users can adjust the specific parameters of an exercise (such as the used weight) directly within the selection tab before committing it to their plan.

#### 3.17.2 Advanced Weight Adjustment Controls

To ensure maximum efficiency and ease of use, the system supports multiple input methods for adjusting exercise weights:

- **Interactive Clicking**: Ordinary clicks provide granular control for precise weight increments.

- **Continuous Adjustment (Hold-to-Scale)**: Holding down the increment or decrement buttons allows for rapid weight changes, eliminating the need for repetitive clicking.

- **Keyboard and Mouse Synergy**:

    - **Arrow Keys**: Users can utilize the keyboard's arrow keys for quick adjustments.

    - **Scroll Wheel**: The interface is engineered to respond to the mouse scroll wheel, providing a fluid and natural way to scale weights while hovering over the input area.

### 3.18. Translation and Internationalization (i18n)

To ensure global accessibility and a localized experience, the platform features a robust internationalization framework that supports multiple languages across all layers of the application.

#### 3.18.1 Multilingual Architecture

- **URL-Based Language Routing**: The system utilizes SEO-friendly URL structures where the language code (e.g., /en/, /sk/, /es/) is a core part of the address. This allows for direct linking to localized content and improves indexing by search engines.

- **Database Synchronization**: A user's language preference is permanently stored in their profile within the database. This ensures that their selected language remains consistent across different devices and sessions.

- **Full-Stack Translation**: Localization is not limited to static templates. Every text element is translated, including:

    - **HTML Templates**: Server-Side rendered content.

    - **JavaScript / TypeScript**: Dynamic Front-End messages.

    - **Python Back-End**: System notifications, E-mail and others.

#### 3.18.2 Smart Language Selection

- **Intuitive Language Switcher**: Users can instantly change the interface language by clicking the respective country flags in the navigation menu.

- **Automated Detection (Registration)**: During the registration process, if a user provides a phone number, the system intelligently identifies the country area code. Based on this data, the user's preferred language is automatically set in the database, offering a personalized experience from the very first login.

#### 3.18.3 Communication and SEO

- **Localized Notifications**: By storing language preferences, the system ensures that all automated e-mails (e.g., password resets, account suspension alerts) are dispatched in the user's preferred language.

- **Search Engine Optimization (SEO)**: The implementation of multiple language versions significantly boosts the platform's visibility. By providing localized metadata and content, the application achieves higher rankings and better visibility in global Google Search results.

- **Default Language**: The system is configured with English as the primary fallback and default language for all unauthenticated visitors.

### 3.19. Phone Number Validation and Localization Logic

The system integrates the industry-standard **libphonenumber-js** Library to handle international phone number formatting and validation, ensuring data integrity while enhancing the user onboarding experience.

#### 3.19.1 Interactive Input and Formatting

- **Dynamic Auto-Formatting**: As the user types, the input field automatically applies the correct formatting rules (such as spaces and parentheses) specific to the detected country’s standards.

- **Visual Country Indicators**: To provide immediate feedback, the system displays the corresponding country flag next to the input field, updating in real-time based on the entered dial code.

#### 3.19.2 Automated Validation

- **Context-Aware Validation**: Upon losing focus on the input field (on-blur event), the system performs a comprehensive validity check. It verifies the country code, total digit length, and specific numbering plan patterns.

- **Error Notification**: If the number is found to be invalid or mathematically impossible for the given region, the user is immediately notified via a clear visual prompt to correct the entry.

#### 3.19.3 Intelligence-Driven Localization

- **Smart Language Assignment**: During registration, the system intelligently extracts the country information from the phone prefix. This data is used to automatically set the user's preferred language in the database.

- **Language Fallback**: If the website does not yet support the native language of the detected region, the system defaults the user’s preference to English to ensure a consistent experience.

- **Communication Consistency**: This stored preference ensures that all subsequent system interactions, including automated emails and notifications, are delivered in the language most likely understood by the user.

### 3.20. Automated E-mail Notifications

The system includes a comprehensive automated messaging framework designed to keep users informed about account activity, security events, and lifecycle changes.

#### 3.20.1 Security and Activity Alerts

- **Login Notifications**: To protect user accounts from unauthorized access, an informational e-mail is dispatched instantly upon every successful login. This alert serves as a security heartbeat, allowing users to monitor account activity in real-time.

- **Account Lifecycle Messages**: The system triggers automated e-mails for critical account milestones, including:

    - **Registration Confirmation**: Welcoming new users and verifying their setup.

    - **Account Deletion**: Confirming the permanent removal of data as per the user's request.

    - **Password Reset Requests**: Facilitating secure access recovery.

#### 3.20.2 Actionable Content and Navigation

- **Contextual Deep Linking**: Most automated e-mails include direct links to relevant application pages to enhance user convenience.

- **Proactive Security Links**: For example, login alert e-mails specifically include a direct link to the Password Reset Page. This allows the user to take immediate action and secure their account if they do not recognize the login activity.

- **Integrated Localization**: In accordance with the internationalization logic (Section 3.18.3), all e-mails are automatically rendered in the user's preferred language, ensuring clear and effective communication regardless of the region.

#### 3.20.3 Infrastructure and Delivery

- **Reliable SMTP Integration**: The system leverages Google's **SMTP (Simple Mail Transfer Protocol)** infrastructure to handle all outgoing communications. This ensures high deliverability rates and industry-standard encryption (TLS) for all automated messages, maintaining the integrity and security of user correspondence.

### 3.21 OTP Verification Interface

The system features a custom-designed **One-Time Password (OTP)** verification component, optimized for both visual clarity and seamless functional efficiency during security checks.

#### 3.21.1 Input Mechanics and Navigation

- **Segmented Input Fields**: To facilitate the entry of a 6-digit verification code, the interface utilizes six distinct, visually separated input boxes. This structured design provides clear visual guidance and prevents formatting errors.

- **Sequential Auto-Focus**: As the user inputs a digit, the system automatically advances the cursor focus to the next adjacent field, ensuring a fluid, uninterrupted typing experience without the need for manual clicking.

- **Reverse Navigation**: The interface intelligently handles error correction. Pressing the Backspace key not only deletes the current character but also automatically shifts the focus back to the preceding input field, allowing for rapid and intuitive edits.

#### 3.21.2 Clipboard Integration

- **Smart Paste Functionality**: The component fully supports modern clipboard events, accommodating users who prefer to copy the verification code directly from their e-mail.

- **Automated Data Distribution**: When a user pastes a code into any of the input fields, the system's Front-End logic instantly intercepts the clipboard string, verifies its length, and automatically distributes the individual digits across all corresponding fields in the correct sequence.

### 3.22. Loading Effect

To maintain a high-quality user experience and provide clear feedback during data processing, the application features an integrated loading state management system.

#### 3.22.1 Visual Feedback Mechanism

- **Dynamic Loading Spinner**: A high-fidelity spinning animation is triggered during the page's initialization or during significant data fetches. This provides an immediate visual indicator that the application is active and processing the user's request.

- **Seamless Transitions**: Once the page lifecycle is complete and all assets are fully loaded, the spinner utilizes a professional fade-out animation to reveal the content. This prevents jarring visual jumps and creates a polished, "app-like" feel.

#### 3.22.2 Performance Perception

- **State Synchronization**: The visibility of the loader is tied directly to the browser's loading events and asynchronous data synchronization, ensuring that the interface is only revealed once it is fully interactive and ready for user input.

### 3.23. User Media Management

To ensure organized data storage and privacy, the platform utilizes a structured file management system that isolates user-generated content.

#### 3.23.1 Isolated Storage Architecture

- **Unique Directory Mapping**: Every registered user is assigned a dedicated media folder within the server's storage. These folders are named using the user's Unique ID, ensuring that uploaded files - such as profile pictures - are strictly isolated and protected from naming collisions.

- **Asset Organization**: This directory structure allows the system to efficiently reference and retrieve user-specific media while maintaining a high level of backend organization.

#### 3.23.2 Automated Resource Optimization

- **Storage Cleanup on Deletion**: When a user chooses to permanently delete their account, the system triggers an automated cleanup routine. This process recursively deletes the user's entire media folder and all contained files.

- **Server Sustainability**: By removing obsolete assets immediately, the application prevents "data bloating" and ensures that server storage is utilized only for active users, maintaining optimal system performance.

- **Privacy Compliance**: This functionality ensures that no personal imagery or data remains on the server after an account is terminated, aligning with modern data protection standards.

### 3.24. Secure Donations via Stripe

To support the platform's maintenance, a secure donation system is integrated using the **Stripe API**, featuring a custom-engineered interactive payment interface.

#### 3.24.1 Interactive Credit Card UI

- **Realistic Card Design**: The donation form is styled as a physical credit card to enhance the user experience.

- **Two-Sided Input Logic**:

    - **Front Side**: Captures essential details including the cardholder's name, card number, and expiration date.

    - **Back Side**: Specifically designed for the secure entry of the CVC (Card Verification Code), mimicking the real-world interaction of a physical card.

- **Tiered Donation Options**: Users can choose from pre-set donation amounts (1€, 2€, or 5€), simplifying the decision-making process.

#### 3.24.2 Transaction Integrity and Webhooks

- **Stripe Webhook Integration**: To ensure maximum reliability, the system utilizes Stripe Webhooks. This server-to-server communication allows the application to monitor and update the transaction status **(Pending, Succeeded, Failed)** in real-time, even if the client's browser is closed or the connection is lost during processing.

- **Status Synchronization**: The database is automatically updated based on the signal received from the webhook, guaranteeing that the internal records always reflect the actual state of the payment.

#### 3.24.3 Data Logging and Error Handling

- **Comprehensive Transaction History**: Every transaction is securely logged in the database. Recorded data includes:

    - **User Context**: Associated User ID (if authenticated).

    - **Payment Metadata**: Cardholder's name, exact amount, timestamp, and final transaction status.

- **Proactive User Feedback**:

    - **Success Path**: Upon successful payment, the user is redirected to the homepage with a confirmation message.

    - **Failure Path**: In the event of incorrect card details or network errors, the user is immediately informed of the failure, and no transaction is finalized until the data is corrected.

### 3.25. Performance Optimization and Caching

To achieve near-instantaneous load times and reduce server overhead, the platform utilizes an advanced caching layer powered by **Redis**. This ensures a superior user experience by minimizing direct database heavy-lifting.

#### 3.25.1 Proactive Cache Warming

- **Background Data Pre-heating**: The system is configured to perform "cache warming" at regular intervals (e.g., every 10 minutes). This process proactively executes complex and resource-intensive database queries - such as retrieving the complete list of articles or user reviews - and stores the results in the Redis cache.

- **Reduced Latency**: By serving "pre-computed" data from memory (RAM) rather than querying the disk-based database, the application delivers responses to the user almost immediately, even under heavy traffic.

#### 3.25.2 Signal-Driven Data Integrity

- **Real-time Invalidation**: To prevent the display of stale data, the system utilizes **Django Signals**. Any modification to the database (such as adding a new article or updating a review) triggers an automatic update to the relevant cache keys.

- **Seamless Updates**: This event-driven architecture ensures that the cache is always synchronized with the database. Users benefit from the speed of Redis while always having access to the most current information.

#### 3.25.3 Infrastructure Efficiency

- **Database Offloading**: By caching the most frequently accessed data, the number of redundant hits to the primary database is significantly reduced. This not only speeds up the site for individual users but also increases the overall scalability of the entire infrastructure.

### 3.26. User Reviews and Feedback System

The platform includes a comprehensive review system displayed on the homepage, allowing users to share their experiences and fostering transparency and community trust.

#### 3.26.1 Review Presentation and Identity

- **Public Visibility**: Every submitted review is publicly accessible, providing prospective users with authentic feedback.

- **Author Identification**: Reviews prominently display the author's name, profile photo, and a visual 5-star rating representing their overall satisfaction.

#### 3.26.2 Data Retention and Privacy

- **Account Deletion Handling (Anonymization)**: To preserve the integrity of the platform's feedback history while respecting user privacy, reviews from deleted accounts remain visible. However, personal identifiers are permanently removed: the profile photo is hidden, and the author's name is dynamically replaced with "Deleted User."

#### 3.26.3 Modification Policies

- **Controlled Editing**: To maintain the authenticity of reviews while allowing for genuine corrections, users are permitted to edit their published reviews with a strict frequency limit of once per month.

- **Permanent Deletion**: Users retain full control over their active data and possess the ability to permanently delete their own reviews at any time.

#### 3.26.4 Sorting and Filtering Capabilities

To help users navigate feedback efficiently, the interface provides robust display controls:

- **Dynamic Sorting**: By default, reviews are ordered chronologically (Latest). Users can easily toggle the sorting mechanism to display the Oldest, Best (highest rated), or Worst (lowest rated) reviews first.

- **Granular Filtering**: For targeted reading, users can apply strict filters to the review feed to display only entries matching a specific star rating (e.g., isolating only 4-star reviews).

### 3.27. Social Post Publication

To foster community engagement, the platform includes a sophisticated post-upload system. This module allows users to share their progress, insights, and media through a highly interactive multi-step interface.

#### 3.27.1 Content Metadata and Tagging

The upload process is handled via a non-intrusive dialog popup form, where users can enrich their posts with several layers of data:

- **Contextual Information**: Users can write detailed descriptions and specify the locality of the post.

- **Social Connections**: Support for tagging other users and adding hashtags is integrated to increase post discoverability and community interaction.

- **Engagement Controls**: For every post, users can customize privacy and interaction settings:

    - **Visibility**: Control who can see the content.

    - **Interaction Toggles**: Option to disable comments or hide the "like" count from other users to focus on content rather than metrics.

#### 3.27.2 Advanced File Selection and Validation

The media handling logic is designed to be robust, ensuring server stability and data integrity:

- **Strict Validation**: Before finalizing an upload, the system verifies all files against specific constraints:

    - **Image Limit**: Maximum 10MB per file.

    - **Video Limit**: Maximum 100MB per file.

    - **Quantity Limit**: A maximum of 5 files per post.

- **Proactive Warning System**: If a file exceeds the limit, a yellow exclamation mark icon appears. Upon hovering (using the tooltip system from Section 4.1.), the user is informed of the specific reason for the warning.

- **Server-Side Security**: Every file is stored on the server under a unique generated name to prevent collisions and ensure secure referencing (as described in Section 3.23.).

#### 3.27.3 Intuitive UX and Media Management

The frontend provides a seamless "Desktop-class" experience for managing media before it is published:

- **Drag-and-Drop Integration**: Users can manually select files or use the Drag-and-Drop zone, which automatically highlights when files are hovered over the area.

- **Live Previews**: Selected media is displayed in a preview gallery, allowing users to verify their selection before committing to the upload.

- **Interactive Reordering**: A standout feature of the UI is the ability to change the order of images by dragging them within the preview gallery. This includes smooth animations to make the manual sequencing intuitive and satisfying.

- **Effortless Removal**: Individual files can be removed from the selection list with a single click on the remove icon, allowing for quick corrections.

#### 3.27.4 Deep Content Inspection (MIME-Type Validation)

- **Beyond File Extensions**: To prevent malicious actors from bypassing security by simply renaming file extensions (e.g., renaming a script to .jpg), the system employs the **python-magic** Library.

- **Magic Byte Analysis**: Every uploaded file is inspected at the binary level. The system reads the "magic bytes" (the initial bytes of the file's data) to determine its true **MIME** type.

- **Integrity Enforcement**: If a file claims to be an image but its internal data structure reveals it is a binary executable or a text script, the system automatically rejects the upload. This provides a robust defense against "file spoofing" attacks and ensures that only genuine media files are ever processed by the server.

#### 3.27.5 Automated Submission Protection

- **Invisible Bot Defense**: The post submission process is secured by an integrated **reCAPTCHA v3** layer. This provides a frictionless experience for legitimate users while silently blocking automated scripts and spam bots from flooding the platform with fake content.

### 3.28. Post Locality and Geospatial Integration

To provide geographic context to shared content, the platform includes a sophisticated location-tagging system powered by professional mapping tools and spatial database frameworks.

#### 3.28.1 Dynamic Location Discovery

- **OpenStreetMap Integration**: The system leverages the **Nominatim API**, the search engine for **OpenStreetMap**, to provide a global database of verified locations without the need for proprietary, paid mapping services.

- **Real-time Search (Type-ahead)**: As a user types a location, the system performs asynchronous API calls to fetch the most relevant geographical results. These results are presented in a selection list for immediate user feedback.

- **Feedback Mechanism**: To maintain a smooth experience during API communication, a Loading Spinner (as described in Section 3.22.) is displayed, informing the user that the system is actively retrieving data.

#### 3.28.2 Verification and Custom Entries

- **Verification Indicator**: The interface includes a visual cue that informs the user whether their entered location matches a verified place in the global database.

- **Flexibility**: While the system encourages verified locations, it allows for custom text entries, ensuring users can describe their location even if it isn't indexed in the mapping API (e.g., "Private Garage Gym").

#### 3.28.3 Advanced Geospatial Backend (GeoDjango)

- **Spatial Data Storage**: For verified locations, the system doesn't just store a string of text; it captures and stores the exact GPS coordinates (latitude and longitude).

- **GeoDjango Framework**: The platform utilizes the **GeoDjango Framework**, an add-on for Django that provides professional-grade support for geographic data. This allows the database to perform spatial queries, such as calculating distances or finding posts within a specific geographic boundary.

- **Data Consistency**: Geographic information is bundled with the post’s metadata, ensuring that location data is perfectly synchronized with images, descriptions, and user tags.

#### 3.28.4 Spatial Reference System (WGS84)

- **Global Geodetic Standard**: All captured coordinates are stored using the **WGS84** (World Geodetic System 1984) standard. This is the industry-standard coordinate system used by GPS worldwide, ensuring that the location data is accurate and universally compatible.

- **Database Precision (SRID 4326)**: In the backend, these spatial points are indexed using **SRID 4326**. This specific spatial reference identifier allows the application to communicate seamlessly with other mapping APIs and ensures that geographic metadata remains consistent during data migration or integration.

- **Mathematical Accuracy**: By using a standardized geodetic system, the platform can perform precise spatial calculations (such as distance measurements or proximity searches) that account for the Earth's curvature, providing more reliable data than simple Cartesian (flat) coordinates.

### 3.29. User Tagging and Mention System

To facilitate community interaction, the platform features a highly sophisticated mentioning system, allowing users to tag others directly within post descriptions. While seemingly simple on the surface, this functionality is powered by a complex background architecture managing rich text and real-time data synchronization.

#### 3.29.1 Intelligent Triggering and Real-Time Search

- **Smart Input Mechanics**: Users can initiate a tag by typing the @ symbol or by clicking a dedicated @ icon. The system intelligently checks for preceding spaces, automatically adding one if missing, to ensure proper formatting.

- **Asynchronous Live Search**: Upon typing the @ symbol followed by characters, an asynchronous JS Fetch request is triggered. This dynamically queries the database and populates a dropdown menu with relevant users in real-time.

- **Data Sanitization**: The search results are strictly filtered to display only active, verified accounts, explicitly excluding suspended users.

- **Keyboard Accessibility**: The dynamic dropdown fully supports keyboard navigation, allowing users to scroll through results with arrow keys and confirm a tag using the Enter key.

#### 3.29.2 Rich Text Rendering and User Experience

- **Custom Content Container**: Because standard ```<textarea>``` elements do not support internal HTML styling, the system utilizes a custom contenteditable container. This allows successfully tagged users to be rendered as highly visible, styled "pills" within the text flow.

- **Secondary Tag Display**: For added clarity, all successfully recognized tags are concurrently displayed as a list below the input area, complete with quick-delete options.

- **Duplicate Prevention**: The system enforces a strict "one tag per user" rule. Attempting to tag an already mentioned user triggers a short, intuitive warning animation rather than a disruptive error message.

- **Text Fallback**: If an @ symbol is typed but no valid user is matched or selected, the system gracefully degrades, treating the input as an ordinary text word.

#### 3.29.3 State Management and Deletion Logic

- **Tag Limits**: To prevent spam, the system enforces a maximum limit of 10 tags per post.

- **Intuitive Deletion**: Users can remove a tag in two ways:

    - Clicking the "X" (delete sign) next to the user's name in the list below the text area.

    - Using the Backspace key directly in the text editor. The system intelligently detects when the cursor collides with a styled tag pill and removes the entire tag entity seamlessly.

#### 3.29.4 Underlying Technical Architecture

- **Cursor and Position Tracking**: The frontend codebase meticulously tracks every user action - typing, deleting, and cursor repositioning—to continuously recalculate and maintain the correct index positions of all tags within the raw text string.

- **Backend Integration**: Upon submission, the parsed list of tagged users is securely transmitted and stored in the relational database alongside the post's core metadata, enabling subsequent notifications and relational queries.

### 3.30. Hashtag Integration and Formatting

To categorize content and enhance global discoverability, the platform features a dynamic hashtag recognition system. This functionality is built upon the same robust, real-time text-parsing architecture used for user mentions.

#### 3.30.1 Trigger Mechanisms and Validation

- **Smart Input Options**: Users can initiate a hashtag manually by typing the # symbol or by interacting with a dedicated interface icon. When the icon is clicked, the system intelligently inserts the # symbol, automatically adding necessary spacing to ensure clean text flow.

- **Space-Triggered Confirmation**: Hashtags are dynamically evaluated during typing. When a user types a keyword following the hash sign and hits the Space key, the system instantly processes the input.

- **Regex Pattern Enforcement**: To maintain database integrity and prevent the creation of malformed or "nonsense" tags, every input is validated against strict Regular Expression (Regex) patterns. If the input fails to meet these specifications, it is gracefully ignored as a tag and treated purely as ordinary text.

#### 3.30.2 Visual Feedback and Uniqueness

- **Dynamic Pill Styling**: Successfully validated hashtags are immediately rendered as highlighted, colored "pills" within the text area, providing the user with immediate visual confirmation of the active tag.

- **Duplicate Prevention**: The system enforces a strict uniqueness protocol. Each specific hashtag can only be active once per post. If a user attempts to type an identical hashtag again, the system processes the secondary instance simply as plain text.

- **Content Limits**: To prevent tag-spamming and maintain optimal visual layout, the system restricts the maximum amount to 5 hashtags per post.

#### 3.30.3 Real-Time Text Parsing and Collision Management

- **Dynamic Re-evaluation**: The frontend continuously monitors keystrokes and cursor positions. If a user deletes text and the cursor collides with an existing styled hashtag, the system dynamically updates its stored position index.

- **State Updates**: During deletion or modification, the system re-evaluates the collided string. If the modification breaks the Regex pattern or introduces a duplicate, the styled pill is instantly reverted to standard text, ensuring the underlying data structure remains perfectly synchronized with the visual output.

### 3.31. Community Search and Asynchronous Follow System

The Community Page serves as the central hub for user discovery and networking. It features a highly optimized search engine and real-time interaction capabilities designed to provide a seamless social experience while minimizing server load.

#### 3.31.1 Optimized Search Architecture

- **Hybrid Filtering System**: To ensure rapid response times and reduce database strain, the search functionality utilizes a combined server-client approach. Upon typing the first character in the search bar, a single database request is triggered to load a batch of relevant users. All subsequent filtering as the user continues to type is processed purely on the client side (JavaScript), eliminating redundant Back-End queries.

- **Query Parameters & Sanitization**: Users can be searched using either their Display Name or their unique Friend Code. To maintain community integrity, the search query strictly filters out suspended or unverified accounts, displaying only users with an "Approved" account status.

- **UI Constraint**: For optimal visual clarity and to prevent layout shifts, the search results dropdown is constrained to display a maximum of 3 highly relevant users at a time.

#### 3.31.2 Interactive UX and State Management

- **Instant State Reset**: The search bar includes a dedicated "Delete" (clear) button. Clicking this button or manually deleting the input instantly clears the search state and automatically refreshes the results UI without any delay.

- **Visual Processing Feedback**: During the brief wait time when the initial request is being fetched from the database, the search area applies a sophisticated blur effect accompanied by "Loading" text. This provides clear contextual feedback, assuring the user that the system is processing their request.

#### 3.31.3 Real-Time Social Interactions

- **Asynchronous Following**: The ability to follow other users is engineered for maximum fluidity. Instead of relying on traditional form submissions, the "Follow" action is powered by the JavaScript Fetch API (POST requests).

- **Seamless State Updates**: This allows the relationship status to be updated in the database and reflected in the user interface in real-time, completely bypassing the need for disruptive page reloads.

### 3.32. Real-Time Notifications and Informative Messaging

To ensure a transparent and responsive user experience, the platform features a centralized messaging system. This module provides immediate visual confirmation for user actions and critical system events, ensuring that the user is always aware of the application’s state.

#### 3.32.1 Transactional Feedback (CRUD Operations)

The system automatically triggers informative messages following significant user interactions, particularly regarding training data:

- **Creation & Updates**: Upon successfully creating or editing a training plan, the user receives a confirmation message, validating that their data has been successfully saved to the database.

- **Deletion Alerts**: When a user removes a plan or an exercise, the system provides a final confirmation of the deletion, preventing any ambiguity regarding the action's success.

#### 3.32.2 Categorized System Messages

To provide context-specific feedback, messages are categorized into distinct types, often utilizing standard color-coding for rapid recognition:

- **Success Messages**: Highlighted for positive outcomes, such as profile updates or successful donations.

- **Error & Warning Alerts**: Inform the user if a specific action could not be completed (e.g., invalid form data).

- **General Information**: Used for non-critical updates or status changes that enhance the overall awareness of the platform's functionality.

#### 3.32.3 Visual Presentation and UX

- **Non-Intrusive Delivery**: These messages are designed to appear as sleek overlays or banners (toasts) that do not disrupt the primary workflow.

- **Ephemeral Existence**: Most informative messages are programmed to be temporary, appearing long enough to be read and then automatically dismissing themselves to maintain a clean and clutter-free interface.

### 3.33. Dynamic Post Feed and Interactive Social Engagement

The Post Feed serves as the central hub for community activity, where users can discover, view, and interact with content seamlessly. It combines a sophisticated media presentation engine with robust, asynchronous social features.

#### 3.33.1 Smart Media Presentation (Carousel)

- **Dynamic Gallery Generation**: Posts containing multiple media files (images or videos) are displayed in an interactive carousel. By default, only the first item is visible.

- **Contextual Navigation**: The UI intelligently adapts to the content. If a post contains multiple files, the system automatically renders navigation arrows and a pagination bar (indicator dots) underneath. If the post contains only a single file, these UI elements are cleanly omitted to prevent visual clutter.

#### 3.33.2 Author Context and Networking

- **Integrated Profiles**: Every post header prominently displays the author's profile picture, username, and current follower count.

- **Smart Follow System**: A "Follow / Unfollow" button is directly integrated into the post header, reflecting the current user's relationship with the author. The system intelligently detects if the user is viewing their own post and automatically hides this button to prevent illogical self-following.

#### 3.33.3 Gamified Micro-Interactions (Likes)

- **Privacy-Respecting Metrics**: Users can like posts, but the total like counter dynamically respects the original author's privacy settings (as configured in the Post Upload process).

- **Enhanced UX Animations**: To provide delightful user feedback, clicking the like button triggers a custom particle animation. A random quantity of hearts (between 1 and 5) spawns and flies in random directions at varying speeds before fading out. This gamified micro-interaction significantly elevates the overall user experience.

#### 3.33.4 Hierarchical Commenting Architecture

- **Engaging Discussions**: Users can share opinions, react to posts, and tag others within the dedicated comment section. To surface the best content, comments are automatically sorted by popularity (most liked first).

- **Nested Reply System**: The platform supports replying to specific comments, creating discussion threads. To maintain a clean UI layout and prevent interface breakage on smaller screens, deep nesting is strictly capped at a maximum depth of 5 levels.

- **Dynamic Reply Toggling**: To maintain a clutter-free interface, nested replies are hidden by default. The frontend intelligently renders a "Show Replies" toggle icon exclusively for comments that contain active sub-threads. If a comment has no replies, the UI remains perfectly clean without generating redundant buttons, allowing users to expand or collapse discussions seamlessly on demand.

- **Visual Discussion Threading**: To enhance readability within nested conversations, the interface implements custom leading lines (threading paths) that visually anchor replies to their parent components. These indicator lines trace down the depth of the discussion and curve elegantly toward the specific reply, providing a clear, intuitive map of the conversation structure.

#### 3.33.5 Fully Asynchronous Engine

- **Zero-Reload Interactions**: Every core social action—liking a post, posting a comment, replying to a thread, or liking a specific comment / reply—is fully asynchronous.

- **Fetch API Integration**: These functionalities are powered by secure JavaScript Fetch POST requests (Section 4.8.), ensuring that the user's position in the feed is never disrupted by a page refresh, mirroring the fluid experience of native mobile applications.

### 3.34. Gamified Activity Engine and Daily Challenges

To drive user engagement and encourage consistent training habits, the platform incorporates a dynamic daily challenge system. This module introduces core gamification mechanics, translating physical consistency into virtual progression.

#### 3.34.1 Automated Task Generation and Rotation

- **Personalized Daily Refresh**: Every calendar day, the backend automatically generates a customized set of randomized challenges tailored for each individual user profile. These tasks are prominently displayed on the user's personal Activity Page.

- **Algorithmic Variety**: The system randomly pulls from a diverse pool of objective blueprints, ensuring the user is faced with unique variations daily. Example challenges include:

  - **Duration Goals**: "Complete 1 hour of total activity today."

  - **Completionist Benchmarks**: "Complete all official tasks for today."

  - **Performance Milestones**: "Beat your current weekly average activity time."

#### 3.34.2 Real-Time Completion Verification & Rewards

- **Activity Tracking Integration**: The platform actively monitors the user's logged metrics throughout the day. When a background event triggers a change in training data, the system instantly recalculates the status of all active daily tasks.

- **Experience Point (XP) Economy**: Upon achieving 100% completion of any designated task, the backend securely logs the state change and automatically rewards the user with a predetermined amount of Experience Points (XP), feeding into their global account progression.

#### 3.34.3 Fluid Visual Progress Indicators

- **Dynamic Background Gradient Fill**: On the client side, every task card acts as a visual progress bar. As progress increases, the card's background dynamically fills using a CSS transition effect that smoothly fades from a warm yellow to a vibrant green.

- **State Settlement UI**: The moment the progress vector hits exactly 100%, the interface immediately updates the task's visual status, checking off a bespoke, custom-styled checkbox and freezing the animation to provide immediate, satisfying visual confirmation to the user.

### 3.35. Custom User Tasks and Interactive To-Do Architecture

To complement the system-generated daily challenges, the platform provides a decentralized personal goal-setting module. This feature enables users to manage their own workflows, adjust priorities on the fly, and maintain a fully customized task list directly within their activity dashboard.

#### 3.35.1 Asynchronous Creation and Live Rendering

- **Instant Task Injection**: Users can seamlessly define and add personalized tasks through a dedicated input container.

- **Non-Blocking Fetch Pipelines**: The creation process utilizes an asynchronous JS Fetch POST Request to communicate with the backend. Upon a successful database entry, the new task is instantly rendered in the UI without a full-page reload.

- **Reactive Aggregation Counters**: The application automatically tracks the scope of the user's workload, immediately incrementing the global "Total Tasks" indicator as soon as a new objective is initialized.

#### 3.35.2 Stateful UI and Drag-and-Drop Reordering

- **Manual Completion and Visual States**: Users retain full control over their task execution and can toggle completion status at will. The interface relies on distinct, high-contrast visual cues to separate pending goals from settled ones:

  - **Active Tasks**: Rendered with standard priority styling.

  - **Completed Tasks**: Transition smoothly to a semi-transparent green background, complemented by a automatically checked custom checkbox.

- **Fluid Drag-and-Drop Layouts**: To maximize organization efficiency, users can dynamically rearrange the layout hierarchy. By dragging and dropping task cards, a client-side tracking script computes the new position indexes, updating the user's preferred layout sequence in real-time.

#### 3.35.3 Dynamic Metrics and Storage Hygiene

- **Live Progress Feedback**: The interface continuously renders a precise counter displaying the ratio of completed tasks against the absolute total (e.g., "3 / 8 Tasks Completed").

- **Bulk Cleanup Action**: To prevent layout clutter and visual exhaustion, an automated cleanup utility is available. With a single click, users can purge all finalized tasks from their active list. This interaction triggers an immediate, synchronized recalculation of both the completed and total task indicators across the entire viewport.

### 3.36. Temporal Experience Amplification (XP Boost Engine)

To optimize user retention and create a high-engagement loop, the platform incorporates a daily temporal modifier system. This feature capitalizes on urgency-driven motivation, rewarding users who maintain a daily training momentum.

#### 3.36.1 Multiplier Allocation and Daily Reset

- **Daily Boost Pool**: Every user is allocated a non-stackable 30-minute double XP (2x) window resetting at the start of each calendar day.

- **Dynamic Triggering**: Upon initializing a new physical training session via the Activity Page, the system automatically checks the availability of the boost pool. If available, the backend applies a strict multiplier to all experience points accumulated during that active window.

#### 3.36.2 Reactive Countdown and Micro-Animations

- **Linear Progress Tracking**: On the client side, the duration of the active amplifier is visualized via a high-precision, thinning progress line. This component utilizes fluid CSS or JavaScript-driven animations to slowly shrink, reflecting the exact remaining lifetime of the active multiplier in real-time.

- **Contextual State Labels**: Anchored directly above the shrinking timeline is a dynamic text label. While active, it explicitly communicates the current multiplier status (e.g., "2x XP Boost Active").

#### 3.36.3 Graceful Expiration Handling

- **Asynchronous State Transition**: The exact moment the 30-minute threshold is crossed, the client-side timer triggers a clean state settlement.

- **UI Deprecation**: The shrinking indicator line fades out entirely from the viewport, and the status label immediately updates to indicate that no multiplier is currently active. Subsequent activities revert to the baseline XP accumulation rates without requiring a application reload.

### 3.37. Comprehensive User Profile Architecture

To serve as the central identity hub for each user, the platform features a highly dynamic and context-aware Profile Page. The system intelligently alters the displayed UI and available data based on the authentication state and the specific social relationship between the viewer and the profile owner.

#### 3.37.1 Seamless Navigation and Identity Display

- **Universal Routing**: Users can effortlessly navigate to any profile by clicking on the respective user's avatar, which is strategically embedded across the platform (e.g., within feed posts, active comment threads, and search results).

- **Public Metrics & Gamification**: The profile header aggregates and displays core identity markers, including the user's display name, customized biography, dynamically earned achievement badges, and their current, live activity streak.

#### 3.37.2 Context-Aware Content Grid and Privacy Controls

- **Interactive Media Grid**: Uploaded content is systematically organized into a clean, visually appealing grid layout. Clicking any specific thumbnail dynamically opens the full post view for detailed interaction.

- **Strict Privacy Masking**: The backend enforces rigid permission checks before delivering grid data. If a specific post is marked as "Followers Only" and the viewing user lacks the required relationship status, the content is securely withheld. Instead of breaking the UI layout, the frontend elegantly renders an "empty post" placeholder, maintaining visual grid symmetry while strictly protecting the author's privacy.

#### 3.37.3 Owner-Exclusive Dashboard and Configurations

When the authenticated user navigates to their own personal profile, the system recognizes their ownership and dynamically unlocks specialized management panels:

- **Private Collections (Saved Posts)**: A dedicated, private section becomes uniquely visible to the owner, allowing them to conveniently browse through their personal collection of bookmarked and saved posts from across the network.

- **Account Settings Portal**: A secure settings toggle icon is rendered exclusively for the owner. This serves as a gateway to the core configuration menu where users can execute crucial account updates, such as modifying their display name, updating linked phone numbers, or executing secure password resets.

- **Global Visibility Toggle**: Embedded directly within the settings menu is a master privacy switch, granting the user absolute control to seamlessly transition their entire profile state between Public and Private visibility modes.

## 4. Features

### 4.1. Contextual Tooltip System

To maintain a clean and minimalist aesthetic without sacrificing clarity, the platform utilizes an integrated tooltip system. This feature provides on-demand explanations for various UI elements, ensuring a shallow learning curve for new users.

#### 4.1.1 User Interface Clarity

- **Non-Intrusive Guidance**: Tooltips act as a secondary layer of information that remains hidden by default. They only appear when a user demonstrates intent by hovering over specific interactive elements, such as abstract icons, action buttons, or complex data points in performance graphs.

- **Brief Contextual Labels**: Each tooltip delivers a concise explanation or label, providing immediate clarity on an element's function without crowding the primary visual layout with unnecessary text.

#### 4.1.2 Intelligent Interaction Design

- **Timed Activation**: To prevent accidental triggering and visual flickering, tooltips are programmed with a short activation delay. They appear only after the cursor remains stationary over an element for a few seconds, ensuring that the information is presented only when the user likely requires it.

- **Positioning**: The overlays are designed to be responsive, appearing in a non-obstructive position relative to the cursor, ensuring that the underlying content remains partially visible for context.

### 4.2. Automated Weekly Performance Reports

To drive user engagement and provide actionable insights, the platform generates a comprehensive activity summary every week. This report allows users to reflect on their progress and compare their current performance with previous data.

#### 4.2.1 Performance Metrics and Analytics

The report aggregates data from the past seven days to provide a clear picture of the user's training habits:

- **Time Analytics**: Includes Total Activity Time and Average Daily Activity Time, providing a high-level view of the user’s commitment.

- **Peak Performance**: Identifies the Most Active Day of the week, helping users recognize their most productive windows.

- **Focus Identification**: Highlights the Favorite Exercise, which is dynamically determined based on the total time spent performing specific movements.

- **Progress Tracking (Delta)**: The system calculates the Percentage Improvement or Decrease compared to the previous week, giving users a clear indicator of their current momentum.

#### 4.2.2 Visual Data Representation (E-mail Integration)

Recognizing that visual data is easier to digest, the report includes high-quality charts. Since standard e-mail clients do not support dynamic JavaScript rendering, the system utilizes a specialized backend approach:

- **Server-Side Chart Generation**: The platform leverages the **QuickChart.io Python Library** to process **Chart.js** configurations.

- **Image Conversion**: Complex data visualizations (Weekly Activity Summary and Weekly Exercises Summary) are converted into static image files on the server.

- **Seamless Delivery**: These images are embedded directly into the report, ensuring that the user sees consistent, high-fidelity graphs regardless of the device or e-mail provider they use.

### 4.3. Advanced Password Security and Argon2 Hashing

To ensure the highest level of data protection and user privacy, the platform implements industry-leading cryptographic standards for password storage, moving beyond default web framework configurations.

#### 4.3.1 Argon2 Implementation

- **State-of-the-Art Hashing**: The system utilizes Argon2, the winner of the Password Hashing Competition, as the primary hashing algorithm. Unlike traditional algorithms, Argon2 is specifically designed to resist brute-force attacks powered by specialized hardware (GPUs and ASICs).

- **Memory-Hard Functionality**: By requiring a significant amount of memory to compute a hash, Argon2 makes it economically and technically unfeasible for attackers to run large-scale parallel cracking attempts, providing a superior layer of defense for user credentials.

#### 4.3.2 Redundancy and Fallback Mechanisms

- **Dynamic Hasher Selection**: While Argon2 is the primary standard, the application’s security architecture includes a prioritized list of fallback hashers (such as **PBKDF2**).

- **Seamless Compatibility**: These fallbacks ensure that the system remains operational and secure even in the event of library unavailability or during the transition of legacy credentials.

- **Automatic Upgrading**: The system is designed to automatically re-hash user passwords using Argon2 upon their next successful login if they were previously stored using an older, weaker algorithm.

#### 4.3.3 Database Integrity

- **Irreversible Encryption**: Passwords are never stored in plain text. Only the resulting high-entropy cryptographic hashes are saved, ensuring that even in the unlikely event of a database breach, the actual user passwords remain computationally impossible to retrieve.

### 4.4. Local Production Simulation (Ngrok)

To ensure that the application is fully "production-ready" before its final deployment, the development environment was augmented with Ngrok to create a secure, publicly accessible tunnel to the local server.

#### 4.4.1 Secure Tunneling and HTTPS Testing

- **Real-World Environment Emulation**: Ngrok provides a temporary, secured HTTPS domain that mirrors the security conditions of a live production server. This allows for the testing of features that strictly require encrypted connections (SSL/TLS).

- **Cross-Device Testing**: By exposing the local development environment to the internet, the application can be tested on actual mobile devices and different operating systems in real-time, ensuring a consistent user experience across all platforms.

#### 4.4.2 Webhook Integration and Debugging

- **Stripe Webhook Validation**: One of the most critical uses of this setup is the verification of the Stripe payment system. Since Stripe’s servers must send asynchronous notifications (webhooks) to a reachable, secure URL, standard localhost (127.0.0.1) environments are insufficient.

- **Asynchronous Flow Inspection**: Ngrok enables the developer to intercept, inspect, and replay webhook events, ensuring that the backend logic (Section 3.24.) correctly handles transaction updates, even in complex failure scenarios.

#### 4.4.3 Pre-Deployment Quality Assurance

- **End-to-End Verification**: This staging-like environment serves as a final checkpoint. It ensures that all third-party API integrations, callback URLs, and security headers are correctly configured and fully functional before the code is pushed to the actual production infrastructure.

### 4.5. Modular Template Architecture (Base HTML)

To ensure a consistent visual identity and maintainable codebase, the application utilizes a modular template system based on Template Inheritance. This architectural pattern follows the "DRY" (Don't Repeat Yourself) principle, significantly reducing code redundancy.

#### 4.5.1 The Structural Blueprint

- **Core Inheritance**: Every individual page (template) within the application inherits from a single, centralized Base HTML file. This file acts as a master blueprint, defining the fundamental structure of the document, including the ```<head>``` metadata, CSS links, and core JavaScript dependencies.

- **Plug-and-Play Blocks**: The base file uses "blocks" (dynamic placeholders) that child templates fill with specific content. This allows the system to swap out only the unique parts of a page while keeping the surrounding structure intact.

#### 4.5.2 Global Component Management

- **Persistent Layout Elements**: Common UI components that remain constant throughout the user journey - such as the Header (Navigation Bar) and Footer - are defined exclusively in the Base HTML.

- **Efficiency in Updates**: Since these global elements are centralized, any design change or update to the navigation logic is performed in a single location and instantly propagates across all sub-pages of the platform.

#### 4.5.3 Optimized Codebase

- **Reduced File Size**: Individual templates remain lightweight and focused only on their specific functionality (e.g., a Login Page or a Training Session Page), as they do not need to repeat boilerplate HTML code.

- **Maintainability**: This structure simplifies the debugging process and makes the application much easier to scale, as the developer can manage the global layout independently from the page-specific logic.

### 4.6. Dual-Layer Regex Validation and Pattern Enforcement

To ensure maximum data integrity and protect the system against malformed or malicious inputs, the platform employs a synchronized dual-layer validation strategy. This approach balances immediate user feedback with rigorous server-side security.

#### 4.6.1 Front-End: Real-Time Pattern Enforcement

- **Immediate UX Feedback**: On the **client-side**, form inputs are protected using HTML5 pattern attributes and JavaScript-based listeners. This prevents users from entering prohibited characters or invalid formats (e.g., in usernames or other user information) in real-time.

- **Proactive Error Prevention**: By restricting the input at the source, the system reduces unnecessary server requests and provides a smoother, more intuitive experience for the user.

#### 4.6.2 Backend: Immutable Regex Security

- **Robust Server-Side Logic**: Since Front-End protections can be bypassed by advanced users (e.g., via browser developer tools or intercepted requests), the backend serves as the ultimate authority. Every incoming data point is re-processed using Regular Expressions (Regex) in Python.

- **Algorithm Synchronization**: The backend Regex patterns are meticulously mirrored from the Front-End logic, ensuring that the rules for data acceptance are consistent across the entire application stack.

- **Unbypassable Defense**: This layer ensures that even if a request is manually crafted or manipulated, it will be rejected by the server if it does not strictly adhere to the defined patterns, preventing SQL injection attempts or data corruption.

#### 4.6.3 Practical Applications

- **Hashtags & Mentions**: Used to ensure that only valid characters are allowed."

- **Credentials**: Ensures that sensitive data follows a predictable, secure format before it ever hits the database.

### 4.7. Custom Dropdown and Select Menus

To maintain a cohesive, premium visual identity, the application completely replaces the default, browser-native ```<select>``` elements with custom-engineered dropdown menus.

#### 4.7.1 Unified Visual Language

- **Aesthetic Consistency**: Standard web select menus are notoriously difficult to style and often clash with modern UI designs. The custom implementation ensures that every dropdown perfectly matches the platform's established design system, integrating seamless typography, consistent color palettes, and appropriate border radii.

- **Cross-Browser Uniformity**: By bypassing the default browser rendering engine for these elements, the custom select menus guarantee a pixel-perfect, identical appearance across all devices and web browsers (Chrome, Safari, Firefox), eliminating visual fragmentation.

#### 4.7.2 Enhanced Interaction Design

- **Polished User Experience**: The custom dropdown architecture allows for sophisticated interaction states that native HTML elements lack. This includes smooth opening and closing animations, distinct hover effects on individual dropdown options, and custom scrollbars.

- **Architectural Control**: Building these menus from scratch using structural HTML (like ```<div>``` and ```<ul>``` elements) combined with JavaScript provides total control over the DOM, allowing for advanced functionalities such as the integration of the dynamic search filters.

### 4.8. Secure Asynchronous Data Handling (Fetch API)

To provide a seamless, page-reload-free experience without compromising application stability, the platform implements a highly secure, end-to-end asynchronous communication flow using **JavaScript Fetch POST Requests**. This architecture prioritizes robust error handling and structured data exchange.

#### 4.8.1 Server-Side Exception Handling (Python/Django)

- **Robust Processing**: Every asynchronous request reaching the Back-End is rigorously validated and processed within strict ```try``` and ```except``` blocks.

- **Controlled JSON Responses**: Instead of allowing the server to crash or return unhandled **500 Internal Server Errors**, the Back-End intelligently evaluates the data. If a validation check fails or an unexpected error occurs, the system safely catches the exception. It then returns a structured **JSON** payload containing a success: false flag, along with any relevant contextual data or error messages.

#### 4.8.2 Client-Side Resilience (JavaScript)

- **Dynamic Evaluation**: Upon receiving the response, the Front-End utilizes ```if``` or ```else``` control structures to evaluate the returned success status. If true, the JavaScript seamlessly updates the DOM with the new data in real-time.

- **Graceful Error Catching**: All Fetch operations are wrapped in JavaScript ```try``` and ```catch``` blocks. Whether the Back-End explicitly returns a false status or a network-level disruption occurs, the client-side logic intercepts the failure.

- **User Feedback**: Instead of failing silently or breaking the UI, the system translates these caught errors into user-friendly notifications (as detailed in Section 3.32.), keeping the user fully informed about why their action could not be completed.

### 4.9. Asynchronous Media Compression and Optimization

To optimize server storage capacity and maintain a highly responsive user experience, all uploaded media files undergo a rigorous, automated compression process. Given the computationally intensive nature of media encoding, these tasks are completely offloaded to background worker processes.

#### 4.9.1 Asynchronous Processing Architecture

- **Celery Task Queue**: All image and video compressions are queued and executed asynchronously via Celery. This ensures the main Django application thread remains unblocked, allowing the platform to handle concurrent uploads smoothly without timeout errors.

- **State Management**: Each media object maintains a strict processing state within the database. Unprocessed posts are temporarily hidden from the public post feed but remain visible exclusively to the author at the top of their personal feed. Once the Celery task completes successfully, the post is flagged as processed and deployed to the public timeline.

#### 4.9.2 Intelligent Processing Pipeline

- **Validation & Detection**: Incoming files are strictly validated using the Magic Bytes library to confirm their true MIME types, alongside threshold checks for initial file sizes and video durations.

- **Image Optimization (Pillow)**: Image files are routed through the Pillow (PIL) library, where they are intelligently resized, compressed, and standardized into the RGB color space.

- **Video Transcoding (FFmpeg)**: Video processing is managed by FFmpeg executed via Python's subprocess module. The system compresses the video track and automatically extracts a high-quality thumbnail for UI rendering.

- **Smart Size Fallback**: The compression engine intelligently compares the final processed file size against the original payload. If compression inadvertently results in a larger file (common with previously heavily compressed media), the system automatically discards the bloated output and retains the original file to maximize storage efficiency.

#### 4.9.3 Real-Time Client-Side Progress Tracking

- **TypeScript Polling**: While Celery processes the files in the background, it continuously broadcasts status updates and progress percentages. The client-side architecture (TypeScript) polls the backend endpoint every 3 seconds to fetch these live metrics.

- **Dynamic Visual Feedback**: Authors can monitor the exact progress of their media processing. The UI renders this data via a dynamic progress bar that features a smooth color transition, fading from yellow to orange as the task approaches 100% completion.

#### 4.9.4 Automated Storage Hygiene

- **Temporary File Deletion**: The compression pipeline generates temporary files during the transcoding process. To prevent storage bloat, the django-cleanup library is utilized to automatically target and eradicate all temporary data immediately after the task is completed or aborted.

### 4.10. High-Performance Infinite Scroll Architecture

To provide a fluid and uninterrupted browsing experience, the post feed implements a highly optimized infinite scroll mechanism. This architecture combines lightweight frontend monitoring with efficient backend data chunking.

#### 4.10.1 Client-Side Intersection Observer

- **Optimized Triggering**: Instead of relying on resource-intensive, traditional scroll event listeners, the frontend utilizes the modern Intersection Observer API. This efficiently detects when the user scrolls near the bottom boundary of the feed, triggering the next data fetch with virtually zero performance overhead on the client's browser.

- **Dynamic DOM Construction (CSR)**: Upon receiving the payload from the server, TypeScript takes over to dynamically construct the complex HTML structure for each new post. Elements such as media carousels, author context, post descriptions, and tags are built and seamlessly appended to the existing feed in real-time.

#### 4.10.2 Server-Side Pagination and JSON API

- **Efficient Database Chunking**: To minimize database load and optimize network transfer speeds, the server-side logic utilizes strict Pagination, dividing the global post query into manageable chunks of 5 posts per request.

- **Lightweight Data Exchange**: When the Intersection Observer triggers a fetch request, the server responds rapidly with raw JSON data containing comprehensive post metadata rather than heavy, pre-rendered HTML templates. This ensures lightning-fast, asynchronous communication between the client and the server.

#### 4.10.3 Dynamic Feed State Reporting (UX)

- **Contextual User Feedback**: A dedicated "Feed Report" UI element is anchored at the bottom of the feed to continuously communicate the current system state to the user.

- **Intelligent State Variations**: The text content of this paragraph adapts dynamically:

  - **Loading State**: Displays a "loading..." indicator while the next batch of 5 posts is being fetched and built.

  - **Error Handling**: Surfaces informative error messages if a network timeout or server issue interrupts the loading process.

  - **Exhausted Feed**: Elegantly informs the user with a specific message once they have reached the absolute end of the database and viewed all available posts.

### 4.11. Custom Video Player and Interactive Controls

To ensure a premium, visually cohesive, and cross-browser consistent media experience, the platform completely replaces the browser's native video controls with a bespoke, custom-engineered video player interface built with JavaScript/TypeScript.

#### 4.11.1 Playback and Time Management

- **Dynamic Play/Pause Toggle**: Users can control playback using a dedicated button that seamlessly swaps between play and pause icons based on the current video state.

- **Real-Time Timekeeping**: The interface features a precise digital timer displaying both the elapsed time and the total duration of the video. This timer, along with the main scrubber line, updates continuously in real-time as the media plays.

#### 4.11.2 Advanced Scrubber and Buffering System

Interactive Progress Bar: A custom-built scrubber visually represents the video's progression. Users can intuitively skip backward or forward (seek) by clicking anywhere on the timeline or dragging the scrubber handle.

- **Hover State Preview**: When moving the cursor across the scrubber bar, the timer dynamically updates to preview the exact timestamp at that specific position, allowing for precise navigation before clicking.

- **Network Buffering Indicator**: To keep the user informed about network performance, the scrubber incorporates a secondary background layer that visualizes the video's buffer and preload progress.

#### 4.11.3 Audio and Viewport Adjustments

- **Granular Volume Control**: Users can adjust the audio output smoothly via a draggable volume slider. The system intelligently updates the volume icon's visual state to reflect the current audio level (e.g., high, low, muted).

- **Quick Mute/Unmute**: Clicking directly on the volume icon instantly toggles the audio state, providing quick control without needing to drag the slider.

- **Immersive Fullscreen**: A dedicated fullscreen toggle button utilizes the browser's Fullscreen API, allowing users to seamlessly expand the video to occupy the entire screen for an immersive viewing experience.

### 4.12. Multidimensional Post Search and Discovery

The post feed includes a sophisticated search engine located at the top of the interface, allowing users to quickly filter and discover content across multiple data layers.

#### 4.12.1 Global Query Coverage

- **Multi-Layered Filtering**: The search algorithm is engineered to scan through various post attributes simultaneously. Users can find relevant content by querying:

  - **Content**: Text within post descriptions and hashtags.

  - **Metadata**: Specific locations or geolocated labels.

  - **Social Context**: Tagged users or the original author’s username.

- **Asynchronous Updates**: Utilizing JS Fetch POST requests, the feed updates in real-time as the user interacts with the search bar, ensuring a fast and responsive experience without full-page reloads.

#### 4.12.2 Search History and State Management

Smart History Tracking: To enhance user convenience, the system maintains a local search history. When a user clicks on the search bar, a dropdown of recent queries is automatically displayed.

- **History Constraints**: The history is limited to a maximum of 5 entries. To keep the list relevant and uncluttered, the system follows a First-In-First-Out (FIFO) logic, where the oldest searches are automatically purged as new ones are added.

- **Manual Control**: Users retain full control over their data, with the ability to manually delete individual history entries or clear the entire search bar instantly using a dedicated "Delete" button.

#### 4.12.3 Real-Time Feedback

- This module provides immediate visual feedback, ensuring that the transition between the global feed and filtered search results is seamless and transparent.

#### 4.13. Viewability Tracking and Algorithmic Feed Optimization

To ensure users are consistently served fresh content and to generate accurate engagement metrics, the post feed incorporates a highly precise view-tracking mechanism. This system differentiates between a rapid scroll-by and a genuine content view.

#### 4.13.1 Client-Side Viewability Detection

- **Viewport Threshold**: Leveraging the Intersection Observer API on the client side, the system continuously monitors the position of each post within the user's viewport. A view sequence is only initiated when a strict threshold is met: a minimum of 80% of the post's total height must be visible on the screen.

- **Time-Based Verification**: Once the 80% visibility threshold is achieved, a background timer starts. If the user pauses their scrolling and the post remains in this highly visible state for 1 uninterrupted second, the system confirms it as a deliberate view.

#### 4.13.2 Asynchronous State Management

- **Real-Time Trigger**: Upon passing the 1-second verification, the client-side JavaScript fires a secure Fetch POST Request to the backend. This silently flags the specific post as "seen" by the authenticated user in the database without disrupting their browsing experience.

#### 4.13.3 Algorithmic Impact and Analytics

- **Feed Demotion Strategy**: This verified view data directly influences the platform's feed generation algorithm. Posts marked as "seen" are systematically demoted to lower positions in subsequent feed requests. This ensures that returning users are always prioritized with new, undiscovered content at the top of their feed.

- **Verified Engagement Metrics**: By filtering out accidental scrolls, the backend aggregates these confirmed views to calculate highly accurate Unique View counts. This provides robust, trustworthy analytics regarding the true reach and performance of every uploaded post.

### 4.14. Relational Database Optimization (Many-to-Many Architecture)

To ensure high performance, data integrity, and efficient querying, the backend database strictly utilizes Django's Many-to-Many (M2M) relational fields rather than flat Array fields for complex data associations.

#### 4.14.1 Structural Integrity via Junction Tables

- **Relational Mapping**: When defining relationships such as "Followers" (where multiple users can follow multiple other users), the system avoids storing raw User IDs within a basic ArrayField. Instead, Django's M2M implementation automatically generates a dedicated, hidden junction table (join table) in the database.

- **Referential Integrity**: This architecture ensures strict database normalization. Because the relationships are established using Foreign Keys within the junction table, the system inherently prevents "orphaned" data (e.g., if a user is deleted, their connections are automatically resolved, which would not happen with static IDs in an array).

#### 4.14.2 Query Performance and ORM Efficiency

- **Optimized Lookups**: By utilizing dedicated junction tables, the underlying SQL database (e.g., PostgreSQL) can leverage indexing on the relationship mapping. This drastically accelerates complex lookup queries compared to scanning and parsing flat array structures.

- **Bidirectional Traversal**: The M2M architecture allows the Django Object-Relational Mapper (ORM) to perform highly efficient reverse queries. For example, the system can instantly fetch all users whom a specific user is following, or inversely, fetch all followers of that user, using simple and fast .filter() or .prefetch_related() methods without heavy algorithmic processing.

### 4.15. Adaptive HTTP Live Streaming (HLS) Architecture

To provide an enterprise-grade, buffer-free media experience, the platform completely moves beyond standard .mp4 delivery, implementing a robust HTTP Live Streaming (HLS) architecture. This allows the video player to dynamically adapt to the user's specific network conditions in real-time.

#### 4.15.1 Asynchronous Multi-Bitrate Transcoding

FFmpeg Segmentation Pipeline: Upon upload, video files are routed through an intensive, asynchronous Celery background worker. Utilizing FFmpeg, the system avoids serving monolithic .mp4 files.

Multi-Tier Resolution: The original file is transcoded into multiple quality profiles (specifically 480p, 720p, and 1080p).

Micro-Chunking: Each resolution track is sliced into highly manageable, 4-second video segments (.ts files). The system automatically generates a master playlist index (.m3u8 file) that maps these segments together, orchestrating exactly how the player should request the pieces.

#### 4.15.2 Intelligent Bandwidth Adaptation

- **Automatic Quality Shifting**: The HLS protocol continuously monitors the client's network speed. If the user's bandwidth drops, the player seamlessly requests the next 4-second segment from a lower-resolution pool (e.g., shifting from 1080p to 480p), entirely preventing playback interruptions or buffering wheels.

- **Manual User Override**: Users retain full control over their viewing experience. A built-in quality selector allows them to manually lock the player to a specific resolution, which is highly beneficial for users looking to strictly manage and minimize their mobile data consumption.

#### 4.15.3 Accelerated Delivery and Cost Efficiency

- **Instant Playback**: Because the system only needs to fetch the initial .m3u8 manifest and the very first 4-second .ts chunk, the time-to-first-frame (TTFF) is blazingly fast. Users no longer have to wait for the server to process large, continuous file responses.

- **Resource Optimization**: The server exclusively streams the exact segments the user is actively watching. If a user stops watching halfway through, the system hasn't wasted server bandwidth delivering the unviewed remainder of the video.

### 4.16. Advanced Popover Menus and Contextual Actions

To provide a clean, uncluttered user interface while offering extensive object-level controls, the platform utilizes a sophisticated, context-aware popover menu system. These menus are universally accessible via standard "three-dot" (meatball) action icons placed strategically throughout the UI.

#### 4.16.1 Modern CSS Anchor Positioning

- **Native Anchoring**: Moving beyond heavy JavaScript calculation libraries, the platform leverages cutting-edge CSS Anchor Positioning. This ensures the main popover dialog is perfectly tethered to its trigger button.

- **Nested Stability**: When navigating into sub-menus, the new dialogs dynamically anchor to their parent popovers. This guarantees structural stability and prevents the menus from rendering off-screen, regardless of the device viewport.

#### 4.16.2 Multi-Level Navigation Architecture

- **Deep Nesting Support**: The menus support intuitive, multi-level nesting for complex, multi-step actions (e.g., initiating a deletion -> confirming the deletion).

- **Safe Traversal**: To prevent accidental menu dismissals and improve the UX, every nested layer includes a dedicated "Back" option, allowing users to effortlessly traverse back up the menu hierarchy without losing their context.

#### 4.16.3 Context-Aware Functionality

The options presented within the popovers dynamically adapt based on the specific object being interacted with and the user's permission level:

- Review Management:

    - Authors can edit their reviews (triggering a redirect to a dedicated editor) or delete them (which opens a nested, fail-safe warning popover).

    - Standard users only see the option to report the review, which opens a nested menu to specify the exact reason for the report.

- Post Settings & Custom Toggles:

    - Authors have granular control over their content. They can adjust real-time settings such as toggling public visibility, enabling/disabling comments, or hiding the like count. These settings are elegantly represented by custom-designed toggle buttons (engineered using hidden HTML checkboxes and styled labels).

    - Standard users are restricted to reporting the post.

- Active Upload Interception: Remarkably, these contextual menus remain active even while a post is asynchronously processing in the background (Section 3.44). Authors can proactively configure the post's settings or completely abort and delete the upload before the compression finishes and the post goes live.

### 4.17. Dynamic Review Pagination and Filtering Engine

To maintain optimal page loading speeds and prevent DOM clutter on the homepage, the application implements an interactive review pagination system. This architecture ensures that large volumes of user feedback are served in lightweight, controlled batches without sacrificing advanced search capabilities.

#### 4.17.1 Server-Side Data Chunking

- **Django Paginator Integration**: The backend leverages Django’s native Paginator system to partition the total review dataset. Reviews are strictly capped at a maximum of 5 items per batch for the initial page load.

- **State Preservation**: The pagination logic is fully integrated with the platform's review filtering system. When users sort reviews by specific criteria (Best, Worst, Latest, Oldest) or filter by a selected star rating, the state is preserved across all subsequent data fetches.

#### 4.17.2 Stateful Frontend Controls (UX)

- **Dynamic "Show More" Generation**: If the system detects additional reviews beyond the currently displayed batch, it dynamically renders a "Show More" button. Clicking this button triggers an asynchronous request to fetch and append the next 5 reviews seamlessly into the view.

- **Collapsible Reset ("Hide" Button)**: Once a user expands the list beyond the initial baseline, an additional "Hide" button is automatically generated. This allows the user to collapse the extended feed instantly and return to the clean layout of the primary 5 reviews, offering superior viewport control.

### 4.18. Contextual Emoji Picker Integration

To enrich user expression and drive engagement within communication fields (such as post descriptions and comments), the platform integrates a modern, highly responsive emoji picker interface.

#### 4.18.1 Lightweight UI Component

- **Native Web Component**: The interface features a dedicated emoji icon embedded directly within designated text inputs and textareas. Toggling this icon opens a sleek menu powered by the emoji-picker-element JavaScript library, which utilizes a high-performance web component architecture.

- **Smart Click-Outside Dismissal**: To maintain a clean and non-intrusive layout, the picker is equipped with a click-outside event listener. If a user interacts with any other part of the screen while the menu is open, the picker automatically dismisses and closes itself.

#### 4.18.2 Cursor-Position Insertion Logic

- **Dynamic Caret Tracking**: Instead of simply appending chosen symbols to the absolute end of a text block, the custom client-side script (TypeScript) dynamically tracks the precise location of the user's cursor (caret position) within the input field.

- **Seamless Text Injection**: When an emoji is selected, the system splits the existing string and injects the character exactly where the user is actively typing, immediately restoring focus and preserving a smooth user workflow.

### 4.19. Dynamic Post Feed Algorithm and Content Ranking

To maximize user engagement and ensure content relevance, the platform completely moves beyond simple chronological timelines or random data retrieval. Instead, the post feed is powered by a sophisticated ranking algorithm engineered to surface the most valuable content dynamically for each individual user.

#### 4.19.1 Social Graph Prioritization

- **Creator Affinity**: The algorithm inherently respects the user's established social connections. Content originating from accounts the user actively follows receives a significant relevance multiplier, ensuring these posts are systematically positioned at the very top of the feed hierarchy.

#### 4.19.2 Engagement-Driven Relevancy

- **Dynamic Interaction Timestamps**: The feed is highly reactive to ongoing community engagement. Every new interaction—specifically a like or a newly published comment—updates the post's internal interaction timestamp in the database.

- **Organic Content Boosting**: Posts with the most recent interaction times are dynamically boosted back to the top of the feed. This creates a merit-based system where highly engaging content, regardless of its original upload date, continuously resurfaces and reaches a broader audience.

#### 4.19.3 View Lifecycle and Content Freshness

- **View-Based Demotion**: Tying directly into the viewability tracking system (Section 3.48), any post that is confirmed as "seen" by the user is systematically demoted to a lower priority rank upon the next feed reload, effectively preventing visual fatigue and repetition.

- **30-Day Freshness Filter**: To maintain an uncluttered experience and optimize database query performance, the algorithm enforces a strict expiration rule. Any previously viewed post that exceeds 30 days in age is completely filtered out and no longer rendered in that specific user's feed.

### 4.20. Gamified Achievement System and Dynamic Badges

To reward long-term user dedication and highlight milestone accomplishments, the platform incorporates a robust, multi-tiered badge and achievement system. These digital accolades are displayed as prominent visual markers on the user's profile page.

#### 4.20.1 Multi-Tiered Rarity Framework

- **Visual Rarity Scale**: Achievements are organized into a strict progression hierarchy composed of 6 distinct color-coded levels that represent the rarity and difficulty of the achievement:

    1. Blue (Common / Baseline)

    1. Green (Uncommon)

    1. Yellow (Rare)

    1. Orange (Epic)

    1. Red (Legendary)

    1. Purple (Mythic / Peak Achievement)

- **Upgradable Archetypes**: Standard badges are not static; they are designed to accumulate data and automatically "level up" to the next color tier as the user crosses higher statistical thresholds.

#### 4.20.2 Milestone and Temporal Event Classifications

The badge generation engine dynamically monitors two distinct categories of user behavior:

- **Performance Milestones**: Tracks core platform engagement metrics, such as the total volume of accumulated Experience Points (XP) or the user's global account level.

- **Temporal and Special Events**: Rewards participation during unique calendar events or community milestones. These include loyalty markers (e.g., celebrating exact years since the user's registration date) and time-sensitive holiday challenges (e.g., successfully completing a physical activity on Christmas Eve).

#### 4.20.3 Encapsulated Model Logic and On-The-Fly Computation

- **Model-Level Integration**: To ensure strict data consistency, the core evaluation logic for all badge states, criteria checking, and tier thresholds is encapsulated directly within the backend User Model architecture (e.g., utilizing Django model methods or property decorators).

- **Live Calculation Real-Time Delivery**: Instead of relying on heavy, continuously running database listeners that update states on every minor action, the system utilizes an on-demand generation strategy. The exact badge levels and rarity distributions are dynamically calculated and loaded in real-time at the precise moment the user's profile page is initialized or refreshed, ensuring absolute performance efficiency.

### 4.21. Automated Activity Streak Engine

To cultivate long-term user retention and encourage daily physical consistency, the application features a robust Activity Streak tracker. This system rewards users for maintaining an unbroken chain of consecutive active days, functioning as a powerful psychological motivator.

#### 4.21.1 Conditional Progression Logic

- **Daily Increment Protocols**: A user's ongoing streak counter is inherently tied to their daily activity logging. The system automatically increments the streak tally by exactly one point upon the successful completion and saving of an activity.

- **Validation Rules**: To prevent artificial inflation, the backend strictly validates two conditions before granting an increment: the user must have recorded an activity on the immediately preceding day, and the streak cannot have already been incremented during the current calendar day.

#### 4.21.2 Asynchronous Expiration Handling

- **Automated Penalty Enforcement**: The integrity of the streak system is maintained by a scheduled, asynchronous Celery background task.

- **48-Hour Inactivity Threshold**: This background worker continuously monitors user activity timestamps. If the worker detects that a user has failed to record any valid activity for two consecutive days (a 48-hour void), it automatically triggers a state reset, reverting the user's current streak counter back to zero.

#### 4.21.3 Dynamic Visual Representation

- **Color-Coded Status UI**: The user's current streak count is prominently displayed on their public Profile Page using an intuitive, state-driven fire icon.

- **Daily Action Indicator**: The frontend logic visually communicates the user's daily status. If the user has already secured their streak for the current day, the icon illuminates as a vibrant orange fire. Conversely, if the daily activity is still pending, the icon remains in a muted gray state, serving as a subtle visual prompt to complete a workout.

### 4.22. Keyboard Accessibility (A11y) and Focus Management

To deliver an inclusive and highly efficient user experience, the platform features robust keyboard navigation support fully aligned with modern accessibility (A11y) guidelines. Users can seamlessly navigate, inspect, and trigger all interactive modules without the use of a pointing device.

#### 4.22.1 High-Contrast Focus Visualization

- **Deterministic Navigation**: Users can traverse sequentially through all focusable UI elements—including buttons, hyperlinks, inputs, and custom controllers—using the standard TAB and SHIFT + TAB keystrokes.

- **Enhanced Focus Rings**: To aid users with visual impairments or those operating purely via keyboard, the default browser focus ring is replaced. Currently focused elements are dynamically emphasized with a thick, high-contrast red outline, ensuring clear visual state confirmation at a glance.

#### 4.22.2 Native-Emulated Controls for Custom Components

- **Tab Index Injection**: Elements designed as interactive components that lack native browser focus capabilities (such as custom div-based cards or icons) are explicitly injected with a tabindex="0" attribute directly within the HTML. This safely positions them into the document's sequential keyboard navigation flow.

- **Keystroke Interception**: To guarantee parity with native buttons, these custom elements are backed by reactive TypeScript event listeners. The system monitors the keydown stream; if a user highlights a custom component and presses the Enter key, the handler intercepts the event and programmatically triggers the underlying .click() method.

#### 4.22.3 Focus Leak Prevention via HTML inert Masking

- **Dynamic Viewport Isolation**: When dealing with collapsible or toggleable layouts (such as slide-out menus, dropdowns, or modal dialogs), hidden content can accidentally catch focus while off-screen, causing erratic viewport jumping.

- **Automated inert Orchestration**: The platform dynamically applies the native HTML inert attribute to inactive or hidden DOM subtrees via TypeScript code. When a container is closed, inert completely strips all containing elements of their focusability and hides them from assistive technologies. Upon activation, the script removes the attribute, instantly restoring accessibility and preventing out-of-order interaction bugs.

### 4.23. Screen Reader Accessibility and ARIA Integration

To ensure the platform is fully inclusive, compliant with modern web accessibility standards (WCAG), and navigable for visually impaired users utilizing assistive technologies, the UI incorporates extensive ARIA (Accessible Rich Internet Applications) implementations.

#### 4.23.1 Descriptive ARIA Labeling

- **Contextualizing Iconography**: Interactive elements that lack explicit text content—most notably buttons or anchors containing only graphical icons (such as an "X" mark for a close button or a magnifying glass for search)—are systematically augmented with aria-label attributes. This guarantees that screen readers accurately verbalize the element's exact function rather than reading out ambiguous HTML tags.

- **Enhanced Readability**: These descriptive tags act as an invisible layer of metadata, seamlessly bridging the gap between visual UI design and auditory navigation, ensuring visually impaired users receive the exact same contextual information as sighted users.

#### 4.23.2 Reactive Accessibility Management

- **Static and Dynamic Injection**: While baseline ARIA attributes are hardcoded directly within the static HTML templates, the accessibility architecture extends deeply into the client-side scripting logic.

- **TypeScript (JS) DOM Mutability**: When interactive content is generated, modified, or destroyed asynchronously (e.g., rendering new task components or dynamically generating popover menus), the governing TypeScript functions actively apply and update the necessary aria-label attributes on the fly. This ensures that the accessibility tree remains perfectly synchronized with the dynamic visual state of the application at all times.

### 4.24. User Privacy and Granular Visibility Controls

To ensure strict data protection and empower users with total control over their digital footprint, the platform implements a robust, multi-layered privacy architecture. Users can manage their visibility at both the global account level and the individual object (post) level.

#### 4.24.1 Global Account Privacy State

- **Master Toggle**: Accessible directly within the Profile Settings menu, users can dynamically switch their global account state between Standard (Public) and Private modes.

- **Inherited Restrictions**: When an account is toggled to Private, the backend enforces a strict override on all content associated with that user. The system automatically restricts the visibility of all uploaded posts exclusively to the user's approved followers, permanently disabling public feed distribution for that specific account.

#### 4.24.2 Strict Content Masking and Routing Protection

- **Feed and URL Interception**: The privacy protocols extend deeply into the application's routing logic. If a non-follower attempts to directly access a specific post URL belonging to a private account, the backend actively intercepts the request.

- **Graceful Degradation (UI)**: Instead of throwing a harsh server error or a broken layout, the application gracefully degrades the view. It renders an "empty post" placeholder equipped with a dedicated notice, clearly informing the unauthorized viewer that the author's account is private and the content is restricted.

#### 4.24.3 Granular Object-Level Visibility

- **Public Account Flexibility**: For users maintaining a Standard (Public) account, the system grants granular, object-level control.

- **Per-Post Toggles**: Authors can manually dictate the audience for each individual upload. By accessing the custom post popover settings menu (Section 3.52), users can seamlessly toggle the specific post's visibility on or off for the general public, allowing a mixed feed of public and follower-only content under a single public profile.

### 4.25. Inline Moderation Engine and Object-Level Admin Controls

To maintain platform integrity, ensure community safety, and prevent the proliferation of unauthorized or explicit content, the application integrates an advanced inline moderation framework. This system injects high-privilege administrative actions directly into the standard contextual popover menus based on the user's role.

#### 4.25.1 Role-Based Menu Augmentation

- **Privileged Viewport Modification**: The system automatically evaluates the authentication token and role flags (e.g., is_staff or is_superuser) of the logged-in session. If the user is identified as an administrator or developer, the frontend dynamically injects specialized management utilities into the standard "three-dot" popover menus.

Direct Content Management: Without navigating away to a separate backend dashboard, an administrator can instantly execute destructive or corrective actions in real-time, such as deleting any user's post, purging non-compliant reviews, or executing immediate account suspensions directly from the viewport.

#### 4.25.2 Two-Step Review Verification Pipeline

- **Manual Moderation Gate**: To guarantee quality control and prevent spam or malicious text, the platform enforces a strict evaluation workflow for user-submitted feedback. Newly created reviews enter a pending state and are hidden from the general public.

- **Approval / Rejection Actions**: Admins are granted dedicated interface buttons to either approve the review (making it instantly visible across the platform and updating the product's aggregate rating) or reject it, which triggers secure deletion from the database.

#### 4.25.3 User-Driven Reporting Architecture

- **Distributed Moderation Assistance**: Features enabling standard users to report non-compliant objects (profiles, posts, and reviews) act as a continuous telemetry stream for the administrative team.

- **Automated vs. Manual Resolution**: The backend is engineered to track report thresholds, opening up future pathways for automated content flagging or temporary suspension algorithms based on cumulative user reports. However, the system fundamentally prioritizes immediate human oversight, ensuring that an administrator can bypass automated queues and manually purge content or suspend offending profiles with a single click.

### 4.26. Network Optimization and Data Saving Engine

To accommodate users operating under restrictive cellular data caps or within areas of low network bandwidth, the platform incorporates a system-wide Data Saving Mode. This module systematically scales down media quality and throttles aggressive data fetching pipelines to minimize network payload volumes.

#### 4.26.1 Global Activation and State Management

- **User-Controlled Toggle**: The feature is accessible as a persistent switch within the User Account Settings on the profile page. Once altered, the preference state is synchronized with the backend session or user profile model to enforce conditional layout rendering.

- **Feed Optimization**: When active, the optimization engine primarily intercepts the main post feed lifecycle during scrolling events, where data consumption is naturally at its peak due to rich media aggregation.

#### 4.26.2 Adaptive Video Streaming and Preloading Constraints

- **Suppressed Preloading**: The platform suppresses all automatic background buffer preloading for video assets. Videos remain in a paused, static thumbnail state and do not transfer data streams until the user issues an explicit, manual click event on the play interface.

- **Low-Resolution Baseline**: Upon activation, video playbacks default strictly to a low-bandwidth 480p resolution pipeline. To preserve user autonomy, this baseline restriction can be manually overridden via the video player's quality selector interface on a per-video basis.

#### 4.26.3 Dynamic Pagination Throttling

- **Reduced Batch Payloads**: The system directly manipulates the chunk sizes utilized by the backend Django Pagination system (Section 3.53).

- **Adaptive Object Limits**: When Data Saving Mode is registered as active, the volume of database objects serialized and dispatched per asynchronous fetch request is scaled down (e.g., reducing the baseline feed chunk from 5 items to a tighter threshold). This effectively limits unnecessary DOM overhead and saves significant downstream mobile data.

### 4.27. Video Audio Stripping and Control Disabling

To provide content creators with precise control over their uploads, the platform includes an option to completely strip audio tracks from video files during the creation process. This guarantees that videos intended to be silent do not process or transmit empty audio streams.

#### 4.27.1 Pre-Upload Audio Disabling

- **Creator Control**: Within the post-creation wizard, users are presented with a dedicated configuration toggle allowing them to disable the audio track for each uploaded video asset individually.

- **Asynchronous Processing Pipeline**: Once submitted, the media payload is pushed to the background architecture. An asynchronous Celery worker intercepts the file and utilizes FFmpeg to permanently strip the audio stream container from the video file. This structural compression permanently modifies the asset at the server level before it is finalized and published.

#### 4.27.2 Reactive Client-Side Media Controls

- **Dynamic Audio Control Stripping**: For posts where the author chose to disable sound, the frontend media player adapts dynamically.

- **Disabled Volume Interfaces**: Within the custom video playback controls in the feed, all volume sliders, mute buttons, and audio configurations are completely disabled or hidden. This provides immediate visual confirmation to the viewing user that the media asset possesses no native audio stream, preventing unnecessary troubleshooting interactions with device volume keys.

### 4.28. Dynamic HTML5 Canvas Ambient Backgrounds

To elevate the visual identity and aesthetic appeal of the platform without compromising runtime interface performance, the application implements a sophisticated ambient background system driven by native HTML5 technology.

#### 4.28.1 High-Performance Graphic Rendering

- **Bitmap Isolation**: Instead of utilizing heavy, complex CSS layout configurations or anchoring a massive volume of individual DOM elements to achieve movement—which would trigger continuous, expensive page reflows—the background effect is completely isolated within a single HTML5 ```<canvas>``` element.

- **Low-Overhead Animation Loops**: The canvas relies on optimized client-side animation routines (such as highly efficient requestAnimationFrame loops via TypeScript). This ensures that subtle, ambient visual elements (e.g., fluid particle networks or soft gradient shifts) flow smoothly at a consistent frame rate across various device configurations.

#### 4.28.2 Non-Intrusive Layout Layering

- **Z-Index Layering and Opacity**: The canvas component is explicitly layered directly behind the active UI viewport using calculated CSS positioning (position: fixed; z-index: -1;).

- **Visual Hierarchy Preservation**: The animation sequences are tuned to a gentle, low-contrast opacity threshold. This design guarantee ensures that the dynamic backdrop remains strictly decorative, never competing with or distracting from foreground text readability or interactive components.

### 4.29. Custom Video Thumbnail Architecture

To provide content creators with complete visual control over their media presentation, the platform features a flexible thumbnail selection engine integrated directly into the video upload pipeline.

#### 4.29.1 User-Defined Thumbnail Selection

- **Upload Wizard Integration**: During the post-creation process, users are equipped with a dedicated interface to manually upload and assign a custom thumbnail image for each individual video asset.

- **Persistent Storage & Mapping**: Once a custom thumbnail is submitted, the image asset is automatically processed and securely written to the platform's file system. Simultaneously, the backend architecture registers the precise relational metadata within the database, permanently linking the custom image file to its parent video object.

#### 4.29.2 Automated Fallback Extraction

- **Zero-Configuration Default**: To ensure a frictionless user experience for creators who bypass manual customization, the backend implements a highly reliable fallback mechanism.

- **First-Frame Generation**: If a video payload is submitted without a designated custom thumbnail, the server's media processing pipeline (utilizing FFmpeg) automatically extracts a frame from the very first second of the clip. This extracted frame is instantly configured as the default visual placeholder for the video across the entire platform.

### 4.30. Video Watch Time Metrics and Creator Analytics

To empower content creators with actionable data regarding audience engagement, the platform features an integrated analytics module specific to video assets.

#### 4.30.1 Exclusive Creator Interface

- **Author-Only Access**: Analytical metrics are strictly classified. The structural data and the corresponding UI toggle buttons are dynamically generated and rendered solely when the authenticated viewer is the verified author of the post.

- **On-Demand Visibility**: To maintain a clean, uncluttered visual hierarchy within the feed, the analytics overlay is hidden by default. Creators can seamlessly reveal or collapse the statistical panel via a dedicated toggle button integrated into their administrative UI.

#### 4.30.2 Telemetry and Metric Integrity

- **Comprehensive Engagement Tracking**: The backend meticulously records aggregated watch time statistics and provides a direct comparative visualization against the video's absolute duration. Furthermore, it tracks the exact volume of unique user views.

- **Anti-Inflation Protocols**: To guarantee absolute data accuracy and prevent artificial metric inflation, the tracking engine enforces a strict validation rule. Watch time and view events are exclusively registered and committed to the database only when the consumer is a distinct user other than the post's creator.

### 4.31. Search Engine Optimization (SEO) and Automated Indexing Infrastructure

To maximize organic discoverability, ensure high visibility across global search engines, and streamline the indexing efficiency of the platform, the architecture incorporates a dedicated Search Engine Optimization (SEO) engine.

#### 4.31.1 Crawler Guidance and Crawl Budget Optimization

- **Deterministic Bot Routing**: The application root deploys a structured robots.txt configuration file. This file serves as the primary directive interface for search engine crawlers (such as Googlebot), defining explicit boundaries between accessible public content and restricted administrative or session-specific endpoints.

- **Crawl Budget Preservation**: By explicitly preventing bots from wasting resources on heavy backend pipelines, the system optimizes its crawl budget, forcing search engines to focus entirely on high-value, content-rich public subpages.

#### 4.31.2 Automated Multi-Tiered Sitemap Generation

The application utilizes the native **Django Sitemap Framework** to dynamically generate and maintain a comprehensive structure of the web directory. The sitemap infrastructure is split into two scalable layers:

- **Static Page Mapping**: Automatically catalogs core structural marketing pages that possess fixed paths, including the Homepage, Blog repository, and public Community hubs.

- **Dynamic Object-Level Mapping**: To ensure rapid indexing of newly generated user content, the framework dynamically hooks into the database. It programmatically generates real-time sitemap nodes for every newly published public post page and every public user profile page, tracking creation and modification timestamps automatically.

#### 4.31.3 Internationalization (i18n) and Multi-Country Visibility

- **Localized Alternative Routing**: To support global user adoption, the sitemap generation engine is tightly coupled with the platform's translation layers.

- **Cross-Language Indexing**: The system injects precise mapping definitions for localized alternatives of identical endpoints (for example, mapping /en/homepage as the direct English counterpart to the Slovak /sk/domov). This structure serves as a native implementation of hreflang signaling, allowing search engines to contextually deliver the correct language variant based on the geolocation and language preferences of the searching end-user, drastically reducing duplicate content penalties.

### 4.32. Advanced Video Scrubbar Previews and VTT Thumbnail Mapping

To replicate industry-standard video streaming interactions and maximize navigational efficiency, the platform incorporates an advanced timeline preview engine. This subsystem allows users to visually inspect chronological checkpoints of a video layout in real-time before jumping to a specific timestamp.

#### 4.32.1 Automated VTT Asset Pipeline

- **Asynchronous Frame Ingestion**: During the initial video upload and processing lifecycle, an automated backend pipeline is triggered. The server processes the video file through **FFmpeg** to extract low-resolution, highly compressed frame captures at deterministic intervals (e.g., one frame per second).

- **WebVTT Schema Mapping**: These serialized image assets are mapped into a standardized WebVTT (.vtt) configuration file. This manifest cleanly binds specific video time vectors (timestamps) to their corresponding image filenames or spatial coordinates within a combined image sprite layout, minimizing redundant HTTP server requests.

#### 4.32.2 Interactive Timeline Hover Interception

- **High-Precision Position Computation**: On the client side, custom video progress bars are equipped with reactive pointer event listeners. When a user hovers over the scrubbar timeline, a client-side TypeScript script continuously captures the cursor's precise horizontal X-coordinate.

- **Temporal Ratio Translation**: The script computes the cursor's exact percentage relative to the total width of the progress bar bounding box. This ratio is instantly multiplied against the absolute duration of the active media element to determine the precise hovered time position.

#### 4.32.3 Dynamic Tooltip Render Management

- **Real-Time Node Injection**: Armed with the calculated timestamp, the client-side engine queries the pre-loaded WebVTT map to isolate the exact matching image frame.

- **Contextual Anchor Overlays**: The application renders a floating preview container directly above the timeline indicator. This tooltip dynamically tracks the horizontal path of the user's cursor, instantaneously refreshing the embedded low-quality frame thumbnail to provide immediate, frictionless visual confirmation of what is included at that exact millisecond of the clip.

### 4.33. Real-Time Communication and Messaging Architecture

To foster community interaction and enable instantaneous user-to-user networking, the platform incorporates a full-duplex Live Chat framework. This module bypasses traditional HTTP request-response cycles, utilizing persistent connections to achieve zero-latency message distribution and state synchronization.

#### 4.33.1 Asynchronous WebSocket Pipeline and Pub/Sub Layer

- **Persistent Event-Driven Layer**: Real-time bi-directional data flow is orchestrated through asynchronous WebSockets, managed natively on the backend via Django Channels.

- **Redis Memory Broker**: To facilitate message routing across multiple server worker processes, the system integrates Redis as a high-performance, in-memory Channel Layer.

- **Atomic Processing Pipeline**: Every transactional message sent by a user follows a strict architectural sequence:

    1. The payload is intercepted by an active client WebSocket connection.

    1. The backend asynchronously processes and validates the event wrapper.

    1. The message state is permanently committed to the persistent database.

    1. The validated payload is instantly broadcasted via the Redis Pub/Sub framework to all interconnected nodes inside the targeted active chatroom (simultaneously reaching both the sender and receiver sessions).

#### 4.33.2 Dynamic UI Generation and Live Reactions

- **Reactive Frontend Injection**: Upon receiving a successfully routed message event from the backend channel, client-side TypeScript (JS) event loops capture the payload. The DOM is mutated programmatically to instantly render the message bubble in the viewport without full-page re-hydration.

- **Live Emoji Telemetry**: Users can issue instantaneous metadata feedback in the form of emoji reactions. These micro-interactions are dispatched as structured WebSocket frames, processed by the backend state managers, and immediately broadcasted to synchronize the reaction counts across all open viewports in the chatroom.

#### 4.33.3 Temporal Message Mutation Guardrails

To preserve conversational integrity, prevent historical rewriting, and mitigate database abuse, the application enforces rigid temporal boundaries on data modification. Authors possess exclusive permissions to mutate or redact their own messages, subject to strict server-validated time windows:

| Layer Action | Permitted Timeline | Operational Guardrail |
| - | - | - |
| Message Content Editing | Within 15 minutes of absolute creation. | Permits instantaneous typo corrections while preventing retrospective manipulation of conversation context. |
| Message Complete Deletion  | Within 24 hours of absolute creation. | Empowers user privacy and content control, after which the database state is locked for archive stability. |

### 4.34. Inbound Follow Request Protocols and Privacy Triage

To complement the global private account states, the platform incorporates a structured relational verification pipeline. When a profile is restricted, the standard instant-follow mechanic is intercepted and converted into a pending authorization request.

#### 4.34.1 Interception and Pending State Routing

- **Conditional Action Hijacking**: When a user initiates a follow action directed at an account flagged as Private, the backend blocks immediate state mutation within the followers database matrix.

- **Asynchronous Request Registration**: Instead of establishing an active relationship, the system instantiates a temporary record inside a pending follow requests table. The requesting user's status is set to "Pending," and the target user is notified without exposing any restricted profile content or feed data to the applicant.

#### 4.34.2 Centralized Management Hub

- **Profile-Embedded Dashboard**: A dedicated, secure notification interface is injected exclusively into the profile page view of the account owner. This panel aggregates all incoming pending requests into a clean, scannable list.

- **Identity Contextualization**: Each item in the request stream displays the applicant's basic identity markers (avatar, name, and username), allowing the account owner to quickly audit the applicant's profile before making a decision.

#### 4.34.3 Triage Options and Relationship Settlement

The account owner is empowered with three explicit operational pathways to manage incoming data traffic:

- **Approve**: Clicking the confirmation element updates the database record via an asynchronous request. The pending state is torn down, the applicant is officially moved into the active followers list, and they are granted immediate access to the author's feed, grids, and private metrics.

- **Reject**: Selecting the rejection element purges the pending row from the database entirely. The applicant remains unverified and blocked from accessing private data, while the UI instantly clears the item from the owner's viewport with a smooth CSS transition.

- **Ignore**: The user can choose to leave the request in an unsettled state. The application maintains the pending row in the database, ensuring the applicant cannot send duplicate requests, while allowing the profile owner to clear their active attention queue without issuing an explicit rejection.

## 5. Security

### 5.1. Authentication Audit Logging (login.log)

To ensure high accountability and enable forensic analysis of user sessions, the application maintains a dedicated, server-side audit trail for all authentication events.

- **Persistent Event Capture**: Every instance of a user logging in or out is strictly captured and appended to a centralized **login.log** file. This provides a permanent record that exists independently of the primary database state.

- **Structured Metadata**: To facilitate rapid investigation of suspicious activities, each log entry contains a detailed snapshot of the event:

    - **Event Context**: The specific reason for the log (e.g., successful login, session termination / logout).

    - **Identity Tracking**: The unique User ID, allowing administrators to correlate sessions with specific accounts.

    - **Network Origin**: The client's IP address, essential for identifying unauthorized access from unexpected geographical locations.

    - **Precise Timestamps**: Every entry is timestamped to the second, allowing for accurate chronological sequencing of events.

    - **Security Utility**: This log serves as a primary diagnostic tool for identifying patterns such as "credential stuffing" or suspicious session-hopping, ensuring that administrators can respond to threats with documented evidence.

### 5.2. Application Error Logging (error.log)

To facilitate rapid debugging and maintain absolute platform stability, all server-side exceptions and handled catch-block errors are meticulously recorded in a dedicated error log file.

- **Diagnostic Metadata**: When a user encounters an unexpected issue, the system automatically captures the exact timestamp of the event, the authenticated user's details, and the client's originating IP address.

- **Traceback Capture**: If the issue is caught within a specific exception-handling block, the custom error message and the relevant stack trace are appended to the log, providing developers with the exact context needed to reproduce and resolve the bug efficiently without relying on user bug reports.

### 5.3. Scheduled Tasks and Cron Job Logging

To monitor the health and successful execution of automated backend processes, the system maintains a separate, dedicated log for all scheduled background tasks.

- **Execution Verification**: This log provides verifiable confirmation of completed asynchronous operations. It records the start and end times of routine maintenance tasks triggered by the server.

- **Operational Metrics**: Entries include detailed metrics regarding the outcome of the task. For example, it logs the exact number of permanently suspended accounts that were successfully purged from the database during a scheduled database cleanup cycle, ensuring full transparency of automated data management.

## 6. Replaced Features

### 6.1. Optimized Video Streaming Architecture (HTTP 206)

To ensure smooth, buffer-free video playback across the platform, the backend implements a specialized streaming architecture rather than relying on standard static file serving methods.

#### 6.1.1 Dedicated Streaming Endpoints

- **Custom Routing**: Instead of exposing raw server file paths directly to the frontend, video media is securely delivered through dedicated, custom URL endpoints. This provides an additional layer of abstraction and control over how media is consumed.

#### 6.1.2 Ranged Response Implementation

- **Chunked Data Transfer**: The server utilizes a ranged response handler (such as the django-ranged-response library) to process incoming video requests. This allows the server to interpret and respond to specific byte-range requests generated by the HTML5 video player.

- **HTTP 206 (Partial Content) Enforcement**: Standard file serving often results in HTTP 200 (OK) responses, which forces the client to download the entire file sequentially. By strictly enforcing HTTP 206 (Partial Content) status codes, the backend allows the browser to stream the video in dynamic chunks.

- **Playback Stability**: This architecture drastically improves video stability, minimizes initial load times, and critically enables the custom video scrubber (Section 3.46) to function correctly. Users can seamlessly skip ahead (seek) to unbuffered sections of the video without waiting for the preceding data to download.