// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
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
});
