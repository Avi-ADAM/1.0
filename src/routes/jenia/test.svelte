<script>
import { render } from 'svelty-email';
import Hello from '$lib/emails/Hello.svelte';
import sendgrid from '@sendgrid/mail';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const emailHtml = render({
	component: Hello,
	props: {
		name: 'Svelte'
	}
});

const options = {
  from: 'you@example.com',
  to: 'user@gmail.com',
  subject: 'hello world',
  html: emailHtml,
};

sendgrid.send(options);
</script>