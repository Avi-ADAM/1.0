# Implementation Plan - Unified Action System

- [x] 1. Set up core infrastructure and type definitions





  - Create directory structure for the action system
  - Define TypeScript interfaces for ActionConfig, AuthRule, NotificationConfig, etc.
  - Set up testing framework (Vitest) with fast-check for property-based testing
  - _Requirements: 1.1, 8.1, 8.2, 8.5_

- [ ]* 1.1 Write property test for configuration validation
  - **Property 9: Configuration Completeness**
  - **Validates: Requirements 8.2, 8.4**

- [x] 2. Implement Action Registry





  - Create ActionRegistry class with Map-based storage
  - Implement registerAction() function
  - Add configuration validation on registration
  - Create helper functions for retrieving action configs
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 2.1 Write property test for action registration
  - **Property 9: Configuration Completeness**
  - **Validates: Requirements 8.2**

- [x] 3. Implement Validation Engine





  - Create ValidationEngine class
  - Implement parameter type validation
  - Implement required parameter checks
  - Add support for custom validation functions
  - Generate descriptive error messages
  - _Requirements: 1.2, 1.3_

- [ ]* 3.1 Write property test for parameter validation
  - **Property 1: Parameter Validation Completeness**
  - **Validates: Requirements 1.2, 1.3**

- [ ]* 3.2 Write unit tests for ValidationEngine
  - Test type validation for all supported types
  - Test required parameter detection
  - Test custom validation functions
  - Test error message generation

- [x] 4. Implement Authorization Engine





  - Create AuthorizationEngine class
  - Implement JWT validation check
  - Implement project membership check (using existing QIDS query 65)
  - Add support for role-based authorization
  - Add support for custom authorization functions
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 4.1 Write property test for authorization enforcement
  - **Property 2: Authorization Enforcement**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 4.2 Write unit tests for AuthorizationEngine
  - Test JWT validation
  - Test project membership checks
  - Test role-based authorization
  - Test custom authorization functions
  - Test error responses

- [x] 5. Implement Strapi Client wrapper





  - Create StrapiClient class
  - Implement execute() method that uses existing QIDS queries
  - Add error handling for GraphQL errors
  - Add retry logic with exponential backoff
  - Add connection pooling
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 5.1 Write property test for Strapi round-trip
  - **Property 3: Strapi Operation Round-Trip**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ]* 5.2 Write unit tests for StrapiClient
  - Test successful GraphQL execution
  - Test error handling
  - Test retry logic
  - Mock Strapi responses

- [x] 6. Implement Action Service core





  - Create ActionService class
  - Implement executeAction() method with full flow
  - Integrate ValidationEngine
  - Integrate AuthorizationEngine
  - Integrate StrapiClient
  - Add comprehensive error handling
  - Add logging for all actions
  - _Requirements: 1.1, 1.4, 9.1, 9.2_

- [ ]* 6.1 Write property test for audit logging
  - **Property 10: Audit Log Completeness**
  - **Validates: Requirements 9.1**

- [ ]* 6.2 Write integration tests for ActionService
  - Test complete action flow from request to Strapi
  - Test validation failures
  - Test authorization failures
  - Test Strapi errors
  - Test logging

- [ ] 7. Create Action API endpoint





  - Create /api/action/+server.ts endpoint
  - Extract user context from cookies (id, jwt, lang)
  - Call ActionService.executeAction()
  - Return standardized responses
  - Add request timeout handling
  - _Requirements: 1.1, 1.5_

- [ ]* 7.1 Write integration tests for API endpoint
  - Test successful action execution
  - Test error responses
  - Test timeout handling
  - Test with real HTTP requests

- [x] 8. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Notification Orchestrator





  - Create NotificationOrchestrator class
  - Implement notify() method
  - Implement getRecipients() with support for all recipient rule types
  - Add recipient filtering (excludeSender, noMail, telegramId)
  - Implement parallel notification sending with Promise.allSettled
  - Add caching for project membership queries
  - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_

- [ ]* 9.1 Write property test for recipient identification
  - **Property 4: Notification Recipient Identification**
  - **Validates: Requirements 4.1, 5.2**

- [ ]* 9.2 Write property test for notification channel filtering
  - **Property 7: Notification Channel Filtering**
  - **Validates: Requirements 6.3, 6.4**

- [ ]* 9.3 Write unit tests for NotificationOrchestrator
  - Test recipient selection for projectMembers
  - Test recipient selection for specificUsers
  - Test sender exclusion
  - Test parallel notification sending
  - Mock notification services

- [x] 10. Implement Email Service wrapper





  - Create EmailService class
  - Implement sendBulk() method
  - Integrate with existing sendBolkMail function
  - Add support for Svelte email template rendering
  - Add language selection logic
  - Filter users with noMail flag
  - _Requirements: 6.1, 6.2, 6.3, 6.7, 6.9_

- [ ]* 10.1 Write unit tests for EmailService
  - Test email rendering with different languages
  - Test noMail filtering
  - Test template rendering
  - Mock sendMail API

- [x] 11. Implement Telegram Service wrapper




  - Create TelegramService class
  - Implement sendBulk() method
  - Integrate with existing sendBolkTelegram function
  - Add language selection logic
  - Filter users without telegramId
  - _Requirements: 6.1, 6.2, 6.6, 6.9_

- [ ]* 11.1 Write unit tests for TelegramService
  - Test Telegram message formatting
  - Test telegramId filtering
  - Test language selection
  - Mock Telegram API

- [x] 12. Implement Push Notification Service wrapper





  - Create PushService class
  - Implement sendBulk() method
  - Integrate with existing pusherer function
  - Handle multiple devices per user (machshirs)
  - Add language selection logic
  - _Requirements: 6.1, 6.2, 6.5, 6.9_

- [ ]* 12.1 Write unit tests for PushService
  - Test push notification payload generation
  - Test multiple device handling
  - Test language selection
  - Mock pusher API

- [ ]* 12.2 Write property test for multi-channel notifications
  - **Property 6: Multi-Channel Notification Consistency**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 13. Integrate notifications into Action Service




  - Add notification triggering to ActionService.executeAction()
  - Ensure notifications are processed asynchronously
  - Add error handling for notification failures
  - Ensure action response returns before notifications complete
  - _Requirements: 4.1, 6.1, 10.2_

- [ ]* 13.1 Write property test for async notification processing
  - **Property 11: Asynchronous Notification Processing**
  - **Validates: Requirements 10.2**

- [x] 14. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Create Socket.IO server






  - Set up new Node.js project in socket-server/ directory
  - Install Socket.IO and dependencies
  - Implement connection handling
  - Implement user authentication via JWT
  - Implement session management (userId -> socketIds mapping)
  - Implement disconnect handling
  - _Requirements: 4.2, 4.4, 4.5_

- [ ]* 15.1 Write integration tests for Socket.IO server
  - Test client connection
  - Test authentication
  - Test session management
  - Test disconnect handling

- [x] 16. Implement Socket.IO broadcast endpoint





  - Add HTTP POST /broadcast endpoint to Socket.IO server
  - Accept userIds and notification payload
  - Broadcast to all sessions of specified users
  - Add error handling
  - _Requirements: 4.2, 4.3_

- [ ]* 16.1 Write property test for socket update delivery
  - **Property 5: Socket Update Delivery**
  - **Validates: Requirements 4.2**

- [ ]* 16.2 Write integration tests for broadcast endpoint
  - Test broadcasting to single user
  - Test broadcasting to multiple users
  - Test with disconnected users
  - Test error handling

- [x] 17. Integrate Socket.IO with Notification Orchestrator





  - Create SocketIOServer client class in Action System
  - Implement broadcast() method that calls Socket.IO server
  - Add to NotificationOrchestrator channels
  - Add error handling for Socket.IO failures
  - _Requirements: 4.2, 6.2_

- [ ]* 17.1 Write integration tests for Socket.IO integration
  - Test end-to-end notification via socket
  - Test with real Socket.IO server
  - Test error handling

- [x] 18. Implement client-side Socket.IO connection




  - Create Socket.IO client in SvelteKit app
  - Implement authentication on connection
  - Implement reconnection logic
  - Add event listeners for notifications
  - _Requirements: 4.2, 7.3_

- [ ]* 18.1 Write integration tests for client-side socket
  - Test connection and authentication
  - Test receiving notifications
  - Test reconnection
  - Test with real Socket.IO server

- [x] 19. Implement Update Strategy system





  - Add updateStrategy to action responses
  - Create client-side update strategy handlers
  - Implement fullRefresh strategy
  - Implement partialUpdate strategy
  - Implement optimistic strategy
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 19.1 Write property test for update strategy propagation
  - **Property 8: Update Strategy Propagation**
  - **Validates: Requirements 7.2, 7.3**

- [ ]* 19.2 Write unit tests for update strategies
  - Test fullRefresh strategy
  - Test partialUpdate strategy
  - Test optimistic strategy
  - Test strategy selection

- [x] 20. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Create first action configuration (updateTask)





  - Define action config for updateTask (existing QIDS 31)
  - Add parameter schema validation
  - Add authorization rules (JWT + project membership)
  - Add notification configuration (project members)
  - Add update strategy (partial update of arr1)
  - Register action in registry
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 21.1 Write integration test for updateTask action
  - Test complete flow from API to Strapi
  - Test notifications are sent
  - Test socket updates are received
  - Test with real Strapi (test database)

- [x] 22. Create client-side action helper





  - Create executeAction() helper function for client
  - Handle API calls to /api/action
  - Handle errors and display to user
  - Handle update strategies
  - Add TypeScript types for all actions
  - _Requirements: 1.1, 7.2_

- [ ]* 22.1 Write unit tests for client action helper
  - Test successful action execution
  - Test error handling
  - Test update strategy execution
  - Mock API responses

- [x] 23. Migrate one component to use new system





  - Choose a simple component that uses updateTask
  - Replace sendToSer call with executeAction
  - Test thoroughly in development
  - Verify notifications work
  - Verify socket updates work
  - _Requirements: 12.1, 12.2, 12.3_

- [ ]* 23.1 Write integration test for migrated component
  - Test component with new action system
  - Test component with old QIDS system
  - Verify both produce same results

- [x] 24. Add migration metrics and logging




  - Add logging to track which system handles each request
  - Create dashboard for migration progress
  - Add metrics for error rates (old vs new)
  - Add metrics for response times (old vs new)
  - _Requirements: 12.4, 12.5_

- [ ] 25. Create action configuration for createMessage
  - Define action config for createMessage (QIDS 1chatsend)
  - Add parameter schema validation
  - Add authorization rules
  - Add notification configuration (forum members)
  - Add update strategy
  - Register action
  - _Requirements: 8.1, 8.2_

- [ ]* 25.1 Write integration test for createMessage action
  - Test complete flow
  - Test notifications to forum members
  - Test socket updates

- [ ] 26. Create action configuration for createTask
  - Define action config for createTask (QIDS 4crtask)
  - Add parameter schema validation
  - Add authorization rules
  - Add notification configuration
  - Add update strategy
  - Register action
  - _Requirements: 8.1, 8.2_

- [ ]* 26.1 Write integration test for createTask action
  - Test complete flow
  - Test notifications
  - Test socket updates

- [x] 27. Create action configuration for createHaluka



  - Define action config for createHaluka (QIDS 69)
  - Add parameter schema validation
  - Add authorization rules
  - No notification configuration (notifications sent at tosplit level to avoid duplicates)
  - Add update strategy
  - Register action
  - **EXTENDED**: Also created createTosplit action (QIDS 70.5)
    - Added QIDS query for createTosplit mutation
    - Created action config with full notification support
    - Notifications sent to all project members (excludeSender: true)
    - Message: "Go to Lev to vote on profit distribution"
    - Priority: high (requires action)
  - _Requirements: 8.1, 8.2_

- [ ]* 27.1 Write integration test for createHaluka action
  - Test complete flow
  - Test notifications to specific users
  - Test socket updates

- [ ] 28. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 29. Create action configuration for timer operations
  - Define configs for startTimer, stopTimer, saveTimer (QIDS 9, 10, 11)
  - Add parameter schema validation
  - Add authorization rules
  - Add notification configuration
  - Add update strategy (optimistic for better UX)
  - Register actions
  - _Requirements: 8.1, 8.2_

- [ ]* 29.1 Write integration tests for timer actions
  - Test all timer operations
  - Test optimistic updates
  - Test notifications

- [ ] 30. Create action configuration for negotiation operations
  - Define configs for CreateNegotiation, CreatePosition, UpdatePosition (QIDS 40, 41, 42)
  - Add parameter schema validation
  - Add authorization rules
  - Add notification configuration (participants)
  - Add update strategy
  - Register actions
  - _Requirements: 8.1, 8.2_

- [ ]* 30.1 Write integration tests for negotiation actions
  - Test all negotiation operations
  - Test notifications to participants
  - Test socket updates

- [ ] 31. Add caching layer
  - Implement project membership cache (5 min TTL)
  - Implement user profile cache (10 min TTL)
  - Add cache invalidation on updates
  - Add cache metrics
  - _Requirements: 5.5, 10.3, 10.4_

- [ ]* 31.1 Write unit tests for caching
  - Test cache hit/miss
  - Test cache invalidation
  - Test TTL expiration

- [ ] 32. Add rate limiting
  - Implement rate limiter (60 actions per user per minute)
  - Add rate limit headers to responses
  - Add rate limit logging
  - _Requirements: Security considerations_

- [ ]* 32.1 Write unit tests for rate limiting
  - Test rate limit enforcement
  - Test rate limit reset
  - Test rate limit headers

- [ ] 33. Create action configuration documentation
  - Document how to create new action configs
  - Provide examples for common patterns
  - Document all available auth rules
  - Document all recipient selection strategies
  - Document all update strategies
  - _Requirements: 8.3_

- [ ] 34. Create migration guide
  - Document how to migrate from QIDS to Action System
  - Provide step-by-step examples
  - Document common pitfalls
  - Create migration checklist
  - _Requirements: 12.3_

- [ ] 35. Set up deployment configuration
  - Create Dockerfile for Socket.IO server
  - Create environment variable documentation
  - Set up monitoring and alerting
  - Create deployment scripts
  - _Requirements: Deployment section_

- [ ]* 35.1 Write deployment tests
  - Test Docker container builds
  - Test environment variable handling
  - Test health checks

- [ ] 36. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 37. Create test mode for notifications
  - Add TEST_MODE environment variable
  - When enabled, log notifications instead of sending
  - Add test mode indicator to responses
  - _Requirements: 11.1, 11.2_

- [ ]* 37.1 Write tests for test mode
  - Test that notifications are logged but not sent
  - Test test mode indicator in responses

- [ ] 38. Implement backward compatibility layer
  - Create wrapper that allows old QIDS calls to work
  - Add logging to track old system usage
  - Add deprecation warnings
  - _Requirements: 12.1, 12.2, 12.4_

- [ ]* 38.1 Write property test for backward compatibility
  - **Property 12: Backward Compatibility**
  - **Validates: Requirements 12.1, 12.2**

- [ ]* 38.2 Write integration tests for backward compatibility
  - Test old QIDS calls still work
  - Test both systems can run simultaneously
  - Test no data conflicts

- [ ] 39. Create action configurations for remaining high-priority actions
  - Migrate 10-15 most-used actions
  - Focus on actions with complex notifications
  - Focus on actions needing better authorization
  - Test each thoroughly
  - _Requirements: 8.1, 8.2_

- [ ]* 39.1 Write integration tests for all migrated actions
  - Test each action end-to-end
  - Test notifications
  - Test socket updates

- [ ] 40. Performance testing and optimization
  - Load test with 1000 concurrent actions
  - Load test Socket.IO with 1000 connections
  - Optimize slow queries
  - Optimize notification sending
  - Verify 500ms response time target
  - _Requirements: 10.1, 10.5_

- [ ]* 40.1 Write performance tests
  - Test action throughput
  - Test socket connection capacity
  - Test notification delivery speed

- [ ] 41. Final integration testing
  - Test complete system end-to-end
  - Test all action configurations
  - Test all notification channels
  - Test all update strategies
  - Test error scenarios
  - Test migration scenarios

- [ ] 42. Documentation and handoff
  - Complete API documentation
  - Complete architecture documentation
  - Create video tutorials
  - Create troubleshooting guide
  - Conduct team training

- [ ] 43. Final Checkpoint - Production readiness
  - Ensure all tests pass, ask the user if questions arise.
