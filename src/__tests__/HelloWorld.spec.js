// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import HelloWorld from '../components/HelloWorld.vue';

describe('HelloWorld.vue', () => {
  it('renders props.msg when passed', () => {
    const msg = 'Test Title';
    const wrapper = mount(HelloWorld, {
      props: { msg },
    });
    expect(wrapper.text()).toContain(msg);
  });

  it('increments counter when button is clicked', async () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Test Title' },
    });
    const button = wrapper.find('#counter-btn');
    expect(button.text()).toContain('Clicks: 0');
    await button.trigger('click');
    expect(button.text()).toContain('Clicks: 1');
  });

  it('displays web mode message when bridge is not available', async () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Test Title' },
    });
    const button = wrapper.find('.ping-btn');
    expect(button.text()).toContain('Test Security Bridge');
    await button.trigger('click');
    expect(button.text()).toContain('No Bridge detected (Web Mode)');
  });

  it('invokes bridge ping when available and displays the response', async () => {
    const mockPing = vi.fn().mockResolvedValue('pong');
    window.electronAPI = { ping: mockPing };

    const wrapper = mount(HelloWorld, {
      props: { msg: 'Test Title' },
    });
    const button = wrapper.find('.ping-btn');
    await button.trigger('click');
    // Wait for the async call and reactivity cycle to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockPing).toHaveBeenCalled();
    expect(button.text()).toContain('Bridge Response: pong');

    delete window.electronAPI;
  });
});
