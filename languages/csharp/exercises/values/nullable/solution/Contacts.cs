// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

/// <summary>A contact: a name, and everything else optional.</summary>
public record Contact(string Name, string? Email, string? Phone, string? Address);

public static class Contacts
{
    public static string Display(Contact contact)
    {
        // Testing narrows the type: inside this block Email is a string, and
        // no null-forgiving `!` is needed to prove it to the compiler.
        if (contact.Email is not null)
        {
            return $"{contact.Name} <{contact.Email}>";
        }

        return contact.Name;
    }

    public static string BestChannel(Contact contact) => contact switch
    {
        // Arms are tried in order, so the priority is the order they are
        // written in rather than something the reader has to reconstruct.
        { Email: not null } => "email",
        { Phone: not null } => "phone",
        { Address: not null } => "post",
        _ => "none",
    };

    public static int Reachable(IEnumerable<Contact> contacts) =>
        contacts.Count(contact => BestChannel(contact) != "none");

    public static string Initials(Contact contact)
    {
        // RemoveEmptyEntries is what makes a name of several spaces produce
        // no parts rather than several empty ones.
        var parts = contact.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return string.Concat(parts.Select(part => char.ToUpperInvariant(part[0])));
    }
}
