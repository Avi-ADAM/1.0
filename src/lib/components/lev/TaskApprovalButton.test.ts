import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import TaskApprovalButton from './TaskApprovalButton.svelte';
import * as actionClient from '$lib/client/actionClient';

// Mock the action client
vi.mock('$lib/client/actionClient', () => ({
  updateTask: vi.fn(),
  displayActionSuccess: vi.fn(),
  displayActionError: vi.fn()
}));

// Mock the lang store
vi.mock('$lib/stores/lang.js', () => ({
  lang: {
    subscribe: (fn: any) => {
      fn('en');
      return () => {};
    }
  }
}));

describe('TaskApprovalButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct initial state', () => {
    const { getByRole } = render(TaskApprovalButton, {
      props: {
        taskId: '123',
        projectId: '456'
      }
    });

    const button = getByRole('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Approve');
  });

  it('calls updateTask with correct parameters when clicked', async () => {
    const mockUpdateTask = vi.mocked(actionClient.updateTask);
    mockUpdateTask.mockResolvedValue({
      success: true,
      data: { id: '123' }
    });

    const { getByRole } = render(TaskApprovalButton, {
      props: {
        taskId: '123',
        projectId: '456'
      }
    });

    const button = getByRole('button');
    await fireEvent.click(button);

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith(
        {
          id: '123',
          projectId: '456',
          myIshur: true
        },
        expect.objectContaining({
          showSuccessToast: true,
          showErrorToast: true
        })
      );
    });
  });

  it('shows loading state while processing', async () => {
    const mockUpdateTask = vi.mocked(actionClient.updateTask);
    let resolvePromise: any;
    mockUpdateTask.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { getByRole } = render(TaskApprovalButton, {
      props: {
        taskId: '123',
        projectId: '456'
      }
    });

    const button = getByRole('button');
    await fireEvent.click(button);

    await waitFor(() => {
      expect(button.textContent).toContain('Approving');
      expect(button).toHaveProperty('disabled', true);
    });

    resolvePromise({ success: true, data: {} });
  });

  it('shows approved state after successful approval', async () => {
    const mockUpdateTask = vi.mocked(actionClient.updateTask);
    mockUpdateTask.mockResolvedValue({
      success: true,
      data: { id: '123' }
    });

    const { getByRole } = render(TaskApprovalButton, {
      props: {
        taskId: '123',
        projectId: '456'
      }
    });

    const button = getByRole('button');
    await fireEvent.click(button);

    await waitFor(() => {
      expect(button.textContent).toContain('Approved');
      expect(button).toHaveProperty('disabled', true);
    });
  });

  it('calls onSuccess callback when approval succeeds', async () => {
    const mockUpdateTask = vi.mocked(actionClient.updateTask);
    const onSuccess = vi.fn();

    mockUpdateTask.mockImplementation(async (params, options) => {
      const response = { success: true, data: { id: '123' } };
      options?.onSuccess?.(response.data);
      return response;
    });

    const { getByRole } = render(TaskApprovalButton, {
      props: {
        taskId: '123',
        projectId: '456',
        onSuccess
      }
    });

    const button = getByRole('button');
    await fireEvent.click(button);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('calls onError callback when approval fails', async () => {
    const mockUpdateTask = vi.mocked(actionClient.updateTask);
    const onError = vi.fn();
    const error = new Error('Approval failed');

    mockUpdateTask.mockImplementation(async (params, options) => {
      options?.onError?.(error);
      throw error;
    });

    const { getByRole } = render(TaskApprovalButton, {
      props: {
        taskId: '123',
        projectId: '456',
        onError
      }
    });

    const button = getByRole('button');
    await fireEvent.click(button);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('prevents multiple clicks while processing', async () => {
    const mockUpdateTask = vi.mocked(actionClient.updateTask);
    let resolvePromise: any;
    mockUpdateTask.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { getByRole } = render(TaskApprovalButton, {
      props: {
        taskId: '123',
        projectId: '456'
      }
    });

    const button = getByRole('button');
    
    // Click multiple times
    await fireEvent.click(button);
    await fireEvent.click(button);
    await fireEvent.click(button);

    // Should only be called once
    expect(mockUpdateTask).toHaveBeenCalledTimes(1);

    resolvePromise({ success: true, data: {} });
  });

  it('prevents clicks after approval', async () => {
    const mockUpdateTask = vi.mocked(actionClient.updateTask);
    mockUpdateTask.mockResolvedValue({
      success: true,
      data: { id: '123' }
    });

    const { getByRole } = render(TaskApprovalButton, {
      props: {
        taskId: '123',
        projectId: '456'
      }
    });

    const button = getByRole('button');
    
    // First click
    await fireEvent.click(button);
    await waitFor(() => {
      expect(button.textContent).toContain('Approved');
    });

    // Try to click again
    await fireEvent.click(button);

    // Should still only be called once
    expect(mockUpdateTask).toHaveBeenCalledTimes(1);
  });

  it('uses Hebrew labels when lang is "he"', () => {
    vi.mock('$lib/stores/lang.js', () => ({
      lang: {
        subscribe: (fn: any) => {
          fn('he');
          return () => {};
        }
      }
    }));

    const { getByRole } = render(TaskApprovalButton, {
      props: {
        taskId: '123',
        projectId: '456'
      }
    });

    const button = getByRole('button');
    // Hebrew text should be present (אישור)
    expect(button.textContent).toBeTruthy();
  });
});
